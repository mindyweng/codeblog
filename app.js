/**
 * Module dependencies.
 */

var express = require('express');
var stylus = require('stylus');
var ArticleProvider = require('./mongodb').ArticleProvider;
var _ = require('underscore');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(stylus.middleware({
      src: __dirname + '/public',
      dest: __dirname + '/public',
      force: true,
      debug: true}));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  app.dynamicHelpers({
    scripts: function(req, res){
      return ['/js/jquery-1.6.2.min.js'];     
    }
  });
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

var articleProvider = new ArticleProvider('localhost', 27017);
var month_names = new Array ( );
month_names[month_names.length] = "Jan";
month_names[month_names.length] = "Feb";
month_names[month_names.length] = "Mar";
month_names[month_names.length] = "Apr";
month_names[month_names.length] = "May";
month_names[month_names.length] = "Jun";
month_names[month_names.length] = "Jul";
month_names[month_names.length] = "Aug";
month_names[month_names.length] = "Sep";
month_names[month_names.length] = "Oct";
month_names[month_names.length] = "Nov";
month_names[month_names.length] = "Dec";

// Routes
app.get('/', function(req, res){
    var posts, allTags;
    articleProvider.findAll( function(error,docs){
        _.each(docs, function(item){
          //convert article time format from Date to Date Month(i.e 10 May)
          var newTime = item.created_at;
          var newTimeFormat = 
            month_names[newTime.getMonth()] + ' ' + newTime.getDate() + ', ' + newTime.getFullYear() + ' by mindy.w' ;          
          item.created_at = newTimeFormat;
          item.author = 'mindy.w';
        });
        res.render('index.jade', { 
            locals: {
                title: 'Blog',
                articles: docs
            }
        });
    });
});

// find all tags
app.get('/tags', function(req, res){
    articleProvider.findTags( function(error, tags){
        _.each(tags, function(tag){
            console.log(tag);
        });
    });
});

/**************************
// New post from code blog
***************************/
app.get('/blog/new', function(req, res) {
    res.render('newpost.jade', { locals: {
        title: 'New Post'
    }
    });
});

app.post('/blog/new', function(req, res){
    articleProvider.save({
        title: req.param('title'),
        body: req.param('body'),
        tags: (req.param('tags').match( /(?=\S)[^,]+?(?=\s*(,|$))/g )),
        code: req.param('code')
    }, function( error, docs) {
        res.redirect('/')
    });
});

/***************************
// Edit post from code blog
****************************/
app.get('/blog/:id/edit', function(req, res) {
    articleProvider.findById(req.params.id, function(error, article) {
        console.log(article);
        res.render('editpost.jade',
        {locals: {
            title: article.title,
            article: article,
            tags: article.tags.join(",")
        }
        });
    });
});

app.post('/blog/:id/edit', function(req, res) {
    console.log(req.param('title'));
    articleProvider.edit(req.params.id, {
        title: req.param('title'),
        body: req.param('body'),
        tags: (req.param('tags').match( /(?=\S)[^,]+?(?=\s*(,|$))/g )),
        code: req.param('code')
    }, function(error, docs) {
        res.redirect('/blog/'+ req.param('id'));
    });

});

/************************
// View Post
************************/
app.get('/blog/:id', function(req, res) {
    articleProvider.findById(req.params.id, function(error, article) {
      console.log(article);
        res.render('viewpost.jade',
        { locals: {
            title: article.title,
            article: article
        }
        });
    });
});

/************************
// Delete a post
************************/
app.get('/blog/:id/remove', function(req, res){
    console.log("removing post:" + req.params.id);
    articleProvider.remove(req.params.id, function(error, article){
        if (error) console.log("error removing article:" + req.params.id);
        res.redirect('/');
    });
});

/***************************
// Add commnet(s) to a post
****************************/
app.post('/blog/addComment', function(req, res) {
    articleProvider.addCommentToArticle(req.param('_id'), {
        person: req.param('person'),
        comment: req.param('comment'),
        created_at: new Date()
       } , function( error, docs) {
           res.redirect('/blog/' + req.param('_id'))
       });
});

app.get('/favicon.ico', function(req, res){
  res.sendfile('favicon.ico');
});

app.get('/URLUtils', function(req, res){
  res.render('dencoder.jade', {locals:{title:'URL Utilities'}});
});

app.get('/qp', function(req, res){
    console.log("hit");
    res.sendfile('qp.html');
});

app.listen(8080);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
