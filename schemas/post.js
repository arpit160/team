mongoose=require('mongoose');

let post= new mongoose.Schema({
    topic:
    {
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    author:
    {
       type:mongoose.Schema.Types.ObjectId,
       ref:'User'
    },
    content:{
        type:String,
        required:true
    },
    date:
    {
        type:String
    }

})

Post= mongoose.model('Post',post);

module.exports.Post=Post;