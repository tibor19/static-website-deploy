const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { lookup } = require('mime-types');

const { getInput, setFailed } = require('@actions/core');
const { BlobServiceClient } = require('@azure/storage-blob');

async function* listFiles(rootFolder){

    const readdir = promisify(fs.readdir);

    const listFilesAsync = async function* (parentFolder){
        const statSync = fs.statSync(parentFolder);
        if(statSync.isFile()){
            yield parentFolder;
        }
        else if (statSync.isDirectory()){
            const files = await readdir(parentFolder); 
            for (const file of files){
                const fileName = path.join(parentFolder, file);
                yield *listFilesAsync(fileName);
            }
        }
    }

    yield *listFilesAsync(rootFolder);
}

async function uploadFileToBlob(containerService, fileName, blobName, blobCacheControl){

    var blobClient = containerService.getBlockBlobClient(blobName);
    var blobContentType = lookup(fileName) || 'application/octet-stream';
    await blobClient.uploadFile(fileName, { blobHTTPHeaders: { blobContentType, blobCacheControl} });

    console.log(`The file ${fileName} was uploaded as ${blobName}, with the content-type of ${blobContentType}`);
}

const main = async () => {

    const connectionString = getInput('connection-string', {required: true});
    if (!connectionString) {
        throw "Connection string must be specified!";
    }

    const enableStaticWebSite = getInput('enabled-static-website');
    const containerName = (enableStaticWebSite) ? "$web" : getInput('blob-container-name') ;
    if (!containerName) {
        throw "Either specify a container name, or set enableStaticWebSite to true!";
    }

    const folder = getInput('folder');
    const accessPolicy = getInput('public-access-policy');
    const indexFile = getInput('index-file') || 'index.html';
    const errorFile = getInput('error-file');
    const removeExistingFiles = getInput('remove-existing-files');
    const blobCacheControl = getInput('cache-control');

    // Change the accessPolicy to map the new interface

    if(accessPolicy && accessPolicy.localeCompare("none", undefined, { sensitivity: 'accent' }) === 0){
        accessPolicy = null;
    }

    if(accessPolicy){

        if(accessPolicy.localeCompare("blobcontainer", undefined, { sensitivity: 'accent' }) === 0){
            accessPolicy = 'container';
        }
        else if(accessPolicy.localeCompare("blob", undefined, { sensitivity: 'accent' }) === 0){
            accessPolicy = 'blob';
        }
    }

    const blobServiceClient = await BlobServiceClient.fromConnectionString(connectionString);

    if (enableStaticWebSite) {
        var props = await blobServiceClient.getProperties();

        props.cors = props.cors || [];
        props.staticWebsite.enabled = true;
        if(!!indexFile){
            props.staticWebsite.indexDocument = indexFile;
        }
        if(!!errorFile){
            props.staticWebsite.errorDocument404Path = errorFile;
        }
        await blobServiceClient.setProperties(props);
    }

    const containerService = blobServiceClient.getContainerClient(containerName);
    if (!await containerService.exists()) {
        await containerService.create({ access: accessPolicy });
    }
    else if(accessPolicy){
        await containerService.setAccessPolicy(accessPolicy);
    }

    if(removeExistingFiles){
        for await (const blob of containerService.listBlobsFlat()){
            await containerService.deleteBlob(blob.name);
        }
    }

    const rootFolder = path.resolve(folder);
    if(fs.statSync(rootFolder).isFile()){
        return await uploadFileToBlob(containerService, rootFolder, path.basename(rootFolder));
    }
    else{
        for await (const fileName of listFiles(rootFolder)) {
            var blobName = path.relative(rootFolder, fileName);
            await uploadFileToBlob(containerService, fileName, blobName, blobCacheControl);
        }
    }
};

main().catch(err => {
    console.error(err);
    console.error(err.stack);
    setFailed(err);
    process.exit(-1);
})