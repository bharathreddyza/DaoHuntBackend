const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is a required field'],
  },
  email: {
    type: String,
    validate: [validator.isEmail, '{VALUE} is not a valid email'],
    required: true,
    unique: true,
  },
  password: {
    type: String,
    default: undefined,
  },
  oAuthType: {
    type: String,
    enum: {
      values: ['google', 'facebook'],
      message: 'Only google and facebook OAuth is available',
    },
    default: undefined,
  },
  googleID: {
    type: String,
    default: undefined,
  },
  facebookID: {
    type: String,
    default: undefined,
  },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.comparePassword = async function (
  givenPassword,
  actualPassword
) {
  return await bcrypt.compare(givenPassword, actualPassword);
};

const userModel = mongoose.model('User', userSchema);

module.exports = userModel;
