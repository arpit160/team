mongoose=require('mongoose');

let like= new mongoose.Schema({
    count:
    {
        type:Number
    },
    
    relatedpost:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:Post
    },
    likedby:[String]
})

let dislike= new mongoose.Schema({
    count:
    {
        type:Number
    },
    
   
    relatedpost:
    {
        type:mongoose.Schema.Types.ObjectId,
        ref:Post
    },
    dislikedby:[String]
})

Like= mongoose.model('Like',like);
Dislike= mongoose.model('Dislike',dislike);

module.exports={Like,Dislike}