import { model, Schema } from "mongoose";


// Define a new user Schema
const UserSchema = new Schema({
    username: { type: String, unique: true },
    password: String,
}, { timestamps: true });

export const UserModel = model('user', UserSchema);

