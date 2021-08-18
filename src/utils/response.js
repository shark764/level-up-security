const success = (args) => ({
        status: 'success',
        requestId: args.requestId,
        data: args.data || {message: 'Operation was successful.'}
    });

const error = (args) => {
    const {code} = args;
    let message;
    switch(code) {
        case 400:
            message ="LUL-SEC000 - Bad request check body/params";
        break;

        case 404:   
            message ="LUL-SEC004 - Not found";
        break;

        case 402:
            message="LUL-SEC002 - Payment required";
        break;

        case 401:
            message="LUL-SEC001 - Authentication required";
        break;

        case 403:
            message="LUL-SEC003 - Forbidden Action";
        break;

        case 422:
            message="LUL-SEC022 - Missing Access Header";
        break;
        case 409:
            message = "LUL-SEC009 - Account is already in use";
        break;
        default:
         message = args.message || 'Server Error';
    }
    return {
        status: 'error',
        requestId: args.requestId,
        error: {
            code: args.code,
            message: args.message || message,
        }
    };
};

const errorObj = (statusCode, message)=> message? {statusCode, message} : {statusCode};

module.exports = { success, error, errorObj };
