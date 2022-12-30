function ready(fn) {
  if (document.readyState !== "loading") {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

ready(function () {
  let width = screen.width;
  let navMobile = document.getElementById("nav");
  if (width <= 991) {
    navMobile.classList.remove("bg-transparent");
    navMobile.classList.add("bg-dark");
  }
});
