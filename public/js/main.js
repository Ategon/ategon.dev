document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('.hamburger-menu')?.addEventListener('click', function() {
    document.querySelector('.first-sidebar').classList.add('show');
  });

  document.querySelector('.overlay')?.addEventListener('click', function() {
    document.querySelector('.first-sidebar').classList.remove('show');
  });

  document.querySelector('.back-button')?.addEventListener('click', function() {
    var currentUrl = window.location.href;
    var parentUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/'));
    window.location.href = parentUrl;
  });
});