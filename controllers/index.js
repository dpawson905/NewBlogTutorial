exports.indexPage = (req, res, next) => {
  res.render('index', { title: 'SimpleBlog' });
}