$(document).ready(function(){
  var textarea = $('#editArticleBody');
  $('#decodeBtn').click(function(){
    textarea.val(decodeURIComponent(textarea.val()));
  });
  $('#encodeBtn').click(function(){
    textarea.val(encodeURIComponent(textarea.val()));
  });
});
