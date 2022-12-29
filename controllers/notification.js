const Notification = require('../models/notification');

exports.deleteNotification = async (req, res, next) => {
  try {
    const _id = req.params.id;
    await Notification.findByIdAndDelete(_id);
    req.toastr.success(
      'Notification Removed',
      (title = "Notification Removal")
    );
    return res.redirect('/');
  } catch (err) {
    console.log(err)
    return res.redirect('/')
  }
}