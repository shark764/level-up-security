const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const redisUtils = require('../../utils/redis')

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Invalid email')
            }
        }
    },
    password: {
        type: String,        
        required: false,
        minlength: 5
    },
    businessName: {
        type: String,
        //required: false,
        trim: true
    },
    firstName: {
        type: String,
        required: false,
        trim: true
    },
    lastName: {
        type: String,
        required: false,
        trim: true
    },
    displayName: {
        type: String,
        required: false,
        trim: true
    }, 
    providerId: {
        type: String,
        trim: true
    },
    provider: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        required: true,
        trim: true
    },
    active: {
        type: Boolean,
        required: true
    }
})


// hash the plain password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        (user.password != null) ? user.password = await bcrypt.hash(user.password, 8) : user.password
    }

    next()    
})

// find user by credentials
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })

    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }

    return user
}

// find user by id
userSchema.statics.getUserById = async (id) => {
    //const userId = mongoose.Types.ObjectId(id)
    const user =  User.findById(id, (err, user)=> {
        
    })
    return user;
    

}

userSchema.methods.generateAuthToken = async function (user) {
    //const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_ACCESS_SECRET)
    const refreshToken = await this.generateRefreshToken(user._id)
    
    //// add token to user model
    // user.tokens = user.tokens.concat({ token })
    // await user.save()

    return {
        accessToken: token,
        refreshToken: refreshToken
    }
}

userSchema.methods.generateRefreshToken = async function (id) {
    //const user = this
    const refreshToken = jwt.sign({ data: id}, process.env.JWT_SESSION_SECRET, {
        expiresIn: 3000000000
    })

    
    // save session to redis
    redisUtils.setKey(
        `{${id}}{SESSION}{${refreshToken}}`, 
        refreshToken, 
        (error, response) => {
            if (error) {
                console.log(error)
            }
    })
    
    return refreshToken
}

userSchema.statics.newUser = async function (data) {        
    return new Promise(async (resolve, reject) => {
        const email = data.email;
        const user = await User.findOne(
                { email })
    
        if (user) {
          return reject('Email is already in use')
        }
        const userToCreate = new User ({
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            password: data.password,
            role: 'Customer', // ROLES.Customer
            active: false
        })
    
        try {
            return resolve(
                await userToCreate.save(userToCreate)
            )
        } catch (err) {
            return reject(err.message)
        }
      })    
}

userSchema.statics.updatePassword = async function (user, newpassword) {
    return new Promise(async (resolve, reject) => {
        user.password = newpassword

        try {
            return resolve(
                await user.save()
            )
        } catch (err) {
            return reject(err.message)
        }
    })
}

const User = mongoose.model('User', userSchema)

module.exports = User