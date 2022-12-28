function ready(fn) {
  if (document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

ready(function () {
  socket.on("online", function (data) {
    toastr.info(`${data.email} has come online`);
    console.log(data)
  });
});


