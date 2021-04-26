mongoose=require('mongoose');

commentschema=new mongoose.Schema(
    {
        comment:String,
        date:String,
        commentauthor:
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        relatedpost:
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:'Post'
        }
    }
)

Comment=mongoose.model('Comment', commentschema)

module.exports.Comment=Comment;

