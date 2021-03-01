const redis = require('ioredis')

const client = redis.createClient({
    port: process.env.REDIS_PORT,
    host: process.env.REDIS_HOST
})

const setKey = (key, value, callback) => {
    return client.set(key, value, callback)
}

const setValidationCode = (code, email) => {
    client.set(code, email, function(err, reply) {
        if (err) {
            //logic
        }
    })
    return code
}

const getValidationCodeValue = (code, callback) => {
    return client.get(code, callback)
}

const removeKey= (key, callback) => {
    return client.del(key, callback)
}

const getRefreshTokenValue = (token, callback) => {
    return client.get(token, callback)
}

const deleteKeysByPattern = (pattern) => {
    const stream = client.scanStream({ match: pattern })
    const pipeline = client.pipeline()
    let localKeys = [];

    stream.on('data', function (resultKeys) {
        console.log("Data Received", localKeys.length);

        for (var i = 0; i < resultKeys.length; i++) {
            localKeys.push(resultKeys[i]);
            pipeline.del(resultKeys[i]);
        }
        
        if(localKeys.length > 100){
            pipeline.exec(()=>{console.log("one batch delete complete")});
            localKeys=[];
            pipeline = client.pipeline();
        }
    });
    stream.on('end', function(){
        pipeline.exec(()=>{console.log("final batch delete complete")});
    });
    stream.on('error', function(err){
        console.log("error", err)
    })
}


module.exports = { setKey, setValidationCode, getValidationCodeValue, removeKey, getRefreshTokenValue, deleteKeysByPattern }