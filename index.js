express=require('express')
app=express();
path=require('path')


engine = require('ejs-mate')
app.engine('ejs', engine);
app.set('view engine','ejs')
app.set('views',path.join(__dirname,'views'))
app.use(express.static(path.join(__dirname, 'public')))

app.get('/',(req,res)=>
{
    res.render("home")
})


app.get('/login',(req,res)=>
{
    res.render("login.ejs");
})

app.get('/register',(req,res)=>
{
    res.render("register.ejs");
})

app.get('/blogpost',(req,res)=>
{
    res.render("blogpost.ejs");
})

app.get('/profile',(req,res)=>
{
    res.render("profile.ejs");
})
app.get('/comments',(req,res)=>
{
    res.render("comments.ejs");
})
let port=process.env.port || 3000;


app.listen(port,()=>
{
    console.log("listening on port 3000")
})