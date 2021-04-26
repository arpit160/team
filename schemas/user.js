mongoose=require('mongoose');

let user= new mongoose.Schema({
    username:
    {
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    phone:
    {
        type:String,
        required:true
    },
    city:
    {
        type:String,
        required:true
    },
    state:
    {
       type:String,
       required:true
    },
    country:
    {
        type:String,
        required:true
    },
    role:
    {
        type:Number,
    }

})

User= mongoose.model('User',user);

module.exports.User=User;