function ready(fn) {
  if (document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

ready(function () {
  socket.on("online", function (data) {
    console.log(data);
  });
  socket.on("notification", (msg) => {
    toastr.info(msg);
    document
      .getElementById("notificationCount")
      .classList.add("notification-alert");
    document.getElementById('notification-box').insertAdjacentHTML('beforeend',
      `<li class="d-flex justify-content-between align-items-center border p-1">
          <p class="fs-6 me-auto p-0 m-0">${msg}</p>
          <form class="d-inline ms-auto" action="#" method="post"> 
            <button class="btn btn-outline-transparent color-primary" type="submit"> 
              <i class="fa-solid fa-xmark color-primary"></i>
            </button>
          </form>
      </li>
      `
    )
  });
});
