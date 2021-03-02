const success = (requestId, data) => {
    return {
        status: 'success',
        requestId: requestId,
        data: data
    }
}

const error = (requestId, code, message) => {
    return {
        status: 'error',
        requestId: requestId,
        error: {
            code: code,
            message: message
        }
    }
}

module.exports = { success, error }
