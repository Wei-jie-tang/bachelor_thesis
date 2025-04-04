

const crypto =require('crypto')
function create_public_key(PublicKey){// to create the public key out of a JWK format
    const publicKey = crypto.createPublicKey({key: PublicKey, format: 'jwk'});//for JWK
    return publicKey

}


function create_machineIDS(metadataFile_log){
    let array=[]
    for(let i=0 ; i< metadataFile_log.length ; i++){
        array.push(metadataFile_log[i].ID)
    }
    return array
}







module.exports={create_machineIDS,create_public_key}