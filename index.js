express=require('express')
app=express();
path=require('path')
mongoose=require('mongoose')
bodyParser = require("body-parser")
session=require("express-session")

app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret:"randomstring",
    saveUninitialized: true,
    resave:false
}))

mongoose.connect('mongodb://localhost:27017/blog', 
{
useNewUrlParser: true,
useCreateIndex: true,
useUnifiedTopology: true,
useFindAndModify: false
})
.then(()=>console.log('connected to database')).
catch(e=>console.log(e))

//layouts
engine = require('ejs-mate')
app.engine('ejs', engine);


app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))
app.use(express.static(path.join(__dirname, 'public')))

var dateFormat = require("dateformat");
var now = new Date();

const {Post}=require('./schemas/post')
const {User}=require('./schemas/user')
const {Comment}=require('./schemas/comment')
const{Like,Dislike}=require('./schemas/likeanddislike')

function isloggedin(req,res,next)
{
   if(req.session.currentuser)
   next();
   else
   res.redirect('/login')
}

app.get('/',(req,res)=>
{
    message=req.session.message;
    req.session.message='';
    res.render("home",{message})
})


app.get('/login',(req,res)=>
{
    message=req.session.message;
    req.session.message='';
    res.render("login.ejs",{message});
})
app.post('/login',async(req,res)=>
{
    let data=req.body
    //console.log(data)
    let check=await User.findOne(data)
    console.log(check)
    if(check)
    {
        req.session.currentuser=check
        res.redirect('/mainpage/1');
    }
    else
    {
        req.session.message='Invalid Username Or Password'
        res.redirect('/login')
    }
})

app.get('/register',(req,res)=>
{
    message=req.session.message;
    req.session.message='';
    res.render("register.ejs",{message});
})
app.post('/register',async (req,res)=>
{
    let info=req.body;
    info.role=0
    let check=await User.findOne({username:info.username})
    if(check)
    {
        req.session.message='Username already exists ,Please try another username'
        res.redirect('/register')
    }
    let user=new User(info)
    await user.save();
    req.session.message='You are Successfully Registered'
    res.redirect('/register')
})

app.get('/mainpage/:index',isloggedin,async (req,res)=>
{
    index=req.params.index;
    //console.log(req.session.currentuser)

    if(req.session.searchby && req.session.searchby!='all' && req.session.searchby!='All')
    posts=await Post.find({category:req.session.searchby}).populate('author');
    else
    posts=await Post.find({}).populate('author');

    //console.log(posts)
    let lb,ub;
    lb=(index-1)*5+1;
    ub=(index)*5;
    let array=[]
    for(let i=lb-1;i<Math.min(ub,posts.length);i++)
    {
      array.push(posts[i]);
    }
    res.render("mainpage.ejs",{posts:array,user:req.session.currentuser});
})

app.get('/profile',isloggedin,(req,res)=>
{
    res.locals.user=req.session.currentuser
    res.render("profile.ejs");
})


app.get('/singlepost/:postid',isloggedin,async(req,res)=>
{
    id=req.params.postid;
    comments=await Comment.find({relatedpost:id}).populate("commentauthor").populate("relatedpost")
    console.log(comments)
    post=await Post.findOne({_id:id}).populate('author')
    res.locals.user=req.session.currentuser
    let likes, dislikes;

    like=await Like.findOne({relatedpost:id})
    if(!like)likes=0;
    else likes=like.count;
     
    dislike=await Dislike.findOne({relatedpost:id})
    if(!dislike)dislikes=0;
    else dislikes=dislike.count;
    
    console.log(like,dislike)

    relatedposts=await Post.find({category:post.category})
    relatedposts=relatedposts.filter((post)=>
    {
        return post._id!=id
    })

    res.render("singlepost.ejs",{post:post,comments:comments,likes:likes,dislikes:dislikes,relatedposts});
})

app.get('/addpost',isloggedin,(req,res)=>
{
    res.locals.user=req.session.currentuser
    res.render("addpost.ejs");
})
app.post('/addpost',async (req,res)=>
{
    //console.log(req.body)
    data=req.body
    data.author=req.session.currentuser._id;
    data.date=dateFormat(now,"shortDate")
    let post=new Post(req.body)
    await post.save();
    res.send("done")
})

app.post('/search',async(req,res)=>
{
    req.session.searchby=req.body.category
    res.redirect("/mainpage/1")
})

app.post("/writecomment/:postid",async(req,res)=>
{
    //console.log(req.session)
    data=req.body;
    data.commentauthor=req.session.currentuser._id;
    data.relatedpost=req.params.postid
    comment= new Comment(data);
    await comment.save()
    res.redirect(`/singlepost/${req.params.postid}`)
})

app.get('/allposts/:userid',isloggedin,async(req,res)=>
{
   posts=await Post.find({author:req.session.currentuser._id})
   console.log("hello",posts)
   res.locals.user=req.session.currentuser; //or we can pass in render function also.
   res.render("displayposts",{posts:posts})
})

app.get('/deletepost/:postid',async(req,res)=>
{
    id=req.params.postid;
    await Post.deleteOne({_id:id})
    res.redirect(`/allposts/${req.session.currentuser._id}`)
})

app.get("/editprofile",isloggedin,(req,res)=>
{
    res.locals.user=req.session.currentuser;
    res.render("editprofile",{data:req.session.currentuser})
})
app.post("/editprofile",isloggedin,async(req,res)=>
{
    await User.updateOne({_id:req.session.currentuser._id},{$set:req.body});
    req.session.currentuser=await User.findOne({_id:req.session.currentuser._id})
    res.redirect('/mainpage/1')
})



app.get('/like/:postid',async(req,res)=>
{
    id=req.params.postid
    like=await Like.findOne({relatedpost:id})
    dislike=await Dislike.findOne({relatedpost:id})
    console.log(like,dislike)
    let isliked;
    let isdisliked;
    let arr1,arr2,c1,c2,ans1,ans2;
    isliked=0;
    isdisliked=0;
    c1=0; c2=0; ans1=0; ans2=0;
    let final="none"
    if(like)
    {
        arr1=like.likedby;
        c1=like.count;
        for(let ind=0;ind<arr1.length;ind++)
        {
            if(arr1[ind]==req.session.currentuser.username)
            {
                isliked=1;
            }
        }
    }
    if(dislike)
    {
        arr2=dislike.dislikedby;
        c2=dislike.count;
        for(let ind=0;ind<arr2.length;ind++)
        {
            if(arr2[ind]==req.session.currentuser.username)
            {
                isdisliked=1;
            }
        }
    }
    ans1=c1; ans2=c2;
    
    if(isliked)
    {
        brr=[]
        arr1.forEach((a)=>
        {
            if(a!=req.session.currentuser.username)brr.push(a);
        })

        await Like.updateOne({relatedpost:id},{$set:{count:c1-1,likedby:brr}})
        ans1=c1-1;
        console.log(arr1)
    }
    else if(isdisliked)
    {
        brr=[]
        arr2.forEach((a)=>
        {
            if(a!=req.session.currentuser.username)brr.push(a);
        })
        await Dislike.updateOne({relatedpost:id},{$set:{count:c2-1,dislikedby:brr}})
        ans2=c2-1;
        if(like)
        {
            arr1.push(req.session.currentuser.username)
            await Like.updateOne({relatedpost:id},{$set:{count:c1+1,likedby:arr1}})
            ans1=c1+1;
        }
        else
        {
            crr=[]
            crr.push(req.session.currentuser.username)
            a=new Like({count:1,relatedpost:id,likedby:crr});
            await a.save();
            ans1=1;
        }
        final="like";
    }
    else
    {
        if(like)
        {
            arr1.push(req.session.currentuser.username)
            await Like.updateOne({relatedpost:id},{$set:{count:c1+1,likedby:arr1}})
            ans1=c1+1;
        }
        else
        {
            brr=[]
            brr.push(req.session.currentuser.username)
            a=new Like({count:1,relatedpost:id,likedby:brr});
            await a.save();
            ans1=1;
        } 
        final='like';
    }
    console.log(ans1,ans2)

    res.send(JSON.stringify({"ans1":ans1,"ans2":ans2,"final":final}))
})


app.get('/dislike/:postid',async(req,res)=>
{
    id=req.params.postid;
    let like=await Like.findOne({relatedpost:id});
    let dislike=await Dislike.findOne({relatedpost:id});
    let isliked=0;
    let isdisliked=0;
    let arr1,arr2,c1,c2,ans1,ans2;
    c1=0; c2=0; ans1=0; ans2=0;
    let final='none'
    if(like)
    {
        arr1=like.likedby;
        c1=like.count;
        for(let ind=0;ind<arr1.length;ind++)
        {
            if(arr1[ind]==req.session.currentuser.username)
            {
                isliked=1;
            }
        }
    }
    if(dislike)
    {
        arr2=dislike.dislikedby;
        c2=dislike.count;
        for(let ind=0;ind<arr2.length;ind++)
        {
            if(arr2[ind]==req.session.currentuser.username)
            {
                isdisliked=1;
            }
        }
    }
    ans1=c1; ans2=c2;

    if(isdisliked)
    {
        brr=[]
        arr2.forEach((a)=>
        {
            if(a!=req.session.currentuser.username)brr.push(a);
        })
        await Dislike.updateOne({relatedpost:id},{$set:{count:c2-1,dislikedby:brr}})
        ans2=c2-1;
    }
    else if(isliked)
    {
        brr=[]
        arr1.forEach((a)=>
        {
            if(a!=req.session.currentuser.username)brr.push(a);
        })
        await Like.updateOne({relatedpost:id},{$set:{count:c1-1,likedby:brr}})
        ans1=c1-1;

        if(dislike)
        {
            arr2.push(req.session.currentuser.username)
            await Dislike.updateOne({relatedpost:id},{$set:{count:c2+1,dislikedby:arr2}})
            ans2=c2+1;
        }
        else
        {
            crr=[]
            crr.push(req.session.currentuser.username)
            a=new Dislike({count:1,relatedpost:id,dislikedby:crr});
            await a.save();
            ans2=1;
        }
        final='dislike'
    }
    else
    {
        if(dislike)
        {
            arr2.push(req.session.currentuser.username)
            await Dislike.updateOne({relatedpost:id},{$set:{count:c2+1,dislikedby:arr2}})
            ans2=c2+1;
        }
        else
        {
            brr=[]
            brr.push(req.session.currentuser.username)
            a=new Dislike({count:1,relatedpost:id,dislikedby:brr});
            await a.save();
            ans2=1;
        } 
        final='dislike'
    }

    res.send(JSON.stringify({"ans1":ans1,"ans2":ans2,"final":final}))
})

app.get('/check/:postid',async(req,res)=>
{
    id=req.params.postid
    like=await Like.findOne({relatedpost:id});
    dislike=await Dislike.findOne({relatedpost:id});
    let final="none";
    if(like)
    {
        arr=like.likedby;
        arr.forEach((a)=>
        {
            if(a==req.session.currentuser.username)
            {
                final="like";
            }
        })
    }
    if(dislike)
    {
        arr=dislike.dislikedby
        arr.forEach((a)=>
        {
            if(a==req.session.currentuser.username)
            {
                final="dislike"
            }
        })
    }
    res.send(JSON.stringify({'final':final}))
})


app.get('/logout',(req,res)=>
{
    console.log(req.session)
    req.session.destroy();
    console.log(req.session)
    res.redirect('/')
})
let port=process.env.port || 3000;


app.listen(port,()=>
{
    console.log("listening on port 3000")
})