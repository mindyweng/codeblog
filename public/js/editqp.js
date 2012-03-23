// simple logging function to be used in chaining. i.e. $("body").log("I am body!");
jQuery.fn.log = function(msg){
    console.log("%s : %o" , msg, this);
    return this;
}
$(document).ready(function(){

    var _checkSave = function(){
        var handleKeyEvents = function(event){
            switch(event.which){
                case 9 /* tab */:
                    var tab = "\t",
                        target = event.target,
                        selectionStart = target.selectionStart,
                        selectionEnd = target.selectionEnd;
                    var pre = target.value.slice(0,selectionStart),
                        post = target.value.slice(selectionEnd,target.value.length),
                        sel = target.value.slice(selectionStart,selectionEnd);
                    // [tab]
                    if(!event.shiftKey){
                        // no selection
                        if (selectionStart == selectionEnd) {
                            target.value = pre.concat(tab).concat(post);
                            target.selectionStart = target.selectionEnd = selectionStart + tab.length;
                        // multi-line selection
                        } else {
                            sel = sel.replace(/\n/g, "\n\t");
                            target.value = pre.concat(tab).concat(sel).concat(post);
                            target.selectionStart = selectionStart;
                            target.selectionEnd = selectionStart + tab.length + sel.length;
                        }
                    // [shift + tab]
                    } else if(event.shiftKey){
                        if (selectionStart == selectionEnd) {
                            pre = pre.split("\n");
                            if(pre[pre.length].match(/^(\t){1}/)) {
                                pre[pre.length] = pre[pre.length].replace(/^(\t){1}/,"");
                                pre = pre.join("\n");
                                target.value = pre.concat(post);
                                target.selectionStart = selectionStart - tab.length;
                                target.selectionEnd = selectionEnd - tab.length;
                            }
                        // multi-line selection
                        } else {
                            sel = sel.split("\n");
                            $(sel).each(function(i, line){
                                sel[i] = line.replace(/^(\t){1}/, "");
                            });
                            sel = sel.join("\n");
                            target.value = pre.concat(sel).concat(post);
                            target.selectionStart = selectionStart;
                            target.selectionEnd =  selectionStart + sel.length;
                        }
                    }
                    return false;
                    break;
                case 83 /* s */:
                    if(event.ctrlKey || event.metaKey) { _handleSave(); return false;}
                    break;
                case 37 /* left <- */ :
                    if(event.ctrlKey) { $(".code").toggle("fast");  $("body").toggleClass("fullSize"); return false;}
                    break;
                case 39 /* right -> */:
                    if(event.ctrlKey) { $(".code").toggle("fast");  $("body").toggleClass("fullSize"); return false;}
                    break;
                case 70 /* ctrl+shift+f */:
                    if(event.ctrlKey && event.shiftKey) {
                        $("#html").val(
                            _formatXml($("#html").val())); 
                    } 
                    break;
                default: break;
            }
        }
        $('.code textarea').keydown(handleKeyEvents);
    }
    _checkSave();
    
    var _handleSave = function(){
        var htmlSource = $("#html").val() || '', 
            cssSource = $("#css").val() || ''
            jsSource = $("#javascript").val() || '';
                        
        var jqScript = "<script src=\"/js/jquery-1.6.2.min.js\" >"; jqScript += "</" + "script" + ">";
        var jsScript = "<script type=\"text/javascript\">" + $("#javascript").val() + "</" + "script" + ">";
        var cssStyle = "<style type=\"text/css\">" + cssSource + "</style>";
        var qp_css_view = '<link rel=\"stylesheet\" type=\"text/css\    " href=\"/css/view.css\" />';
        result.document.close();
        result.document.write(qp_css_view + htmlSource);
        var h = result.document.getElementsByTagName("head")[0];
        var s = document.createElement("style");
        s.setAttribute("type","text/css");
        // make it work in the IE world
        if(s.styleSheet){
            s.styleSheet.cssText = cssSource;
        // rest of the browser
        }else{
            s.appendChild(document.createTextNode(cssSource));
        }
        h.appendChild(s);
        // javascript to bottom
        result.document.write(jqScript + jsScript);
        result.document.close();

        // disabling the browser default ctrl+save event
        return false;
    };
    
    var _formatXml = this.formatXml = function (xml) {
        var reg = /(>)(<)(\/*)/g;
        var wsexp = / *(.*) +\n/g;
        var contexp = /(<.+>)(.+\n)/g;
        xml = xml.replace(reg, '$1\n$2$3').replace(wsexp, '$1\n').replace(contexp, '$1\n$2');
        var pad = 0;
        var formatted = '';
        var lines = xml.split('\n');
        var indent = 0;
        var lastType = 'other';
        // 4 types of tags - single, closing, opening, other (text, doctype, comment) - 4*4 = 16 transitions 
        var transitions = {
            'single->single'    : 0,
            'single->closing'   : -1,
            'single->opening'   : 0,
            'single->other'     : 0,
            'closing->single'   : 0,
            'closing->closing'  : -1,
            'closing->opening'  : 0,
            'closing->other'    : 0,
            'opening->single'   : 1,
            'opening->closing'  : 0, 
            'opening->opening'  : 1,
            'opening->other'    : 1,
            'other->single'     : 0,
            'other->closing'    : -1,
            'other->opening'    : 0,
            'other->other'      : 0
        };

        for (var i=0; i < lines.length; i++) {
            var ln = lines[i];
            var single = Boolean(ln.match(/<.+\/>/)); // is this line a single tag? ex. <br />
            var closing = Boolean(ln.match(/<\/.+>/)); // is this a closing tag? ex. </a>
            var opening = Boolean(ln.match(/<[^!].*>/)); // is this even a tag (that's not <!something>)
            var type = single ? 'single' : closing ? 'closing' : opening ? 'opening' : 'other';
            var fromTo = lastType + '->' + type;
            lastType = type;
            var padding = '';

            indent += transitions[fromTo];
            for (var j = 0; j < indent; j++) {
                padding += '    ';
            }
            formatted += padding + ln + '\n';
        }
        return formatted;
    };
    
    var _escapeHTML = function(str){
        var div = document.createElement('div');
        var text = document.createTextNode(str);
        div.appendChild(text);
        return div.innerHTML;
    }

    var _postToCodeBlog = function(e){
            e.preventDefault();
            var htmlSrc, cssSrc, resultSrc, data = {};
            htmlSrc = '<pre class="html">' + _escapeHTML($('#html').val()) + '</pre>';
            cssSrc = '<pre class="css">' + _escapeHTML($('#css').val()) + '</pre>';
            jsSrc = '<pre class="js">' + _escapeHTML($('#javascript').val()) + '</pre>'; 

            data.title = $('input[name="title"]').val() || "made from qp!";
            data.body = ""; //+ htmlSrc + cssSrc + jsSrc;
            data.tags = $('input[name="tags"]').val() || "css, html";
            data.code = {
                css : $('#css').val(),
                html: $('#html').val(),
                js: $('#javascript').val() 
            };
            $.ajax({ type: 'POST', url: window.location.href, data: data,
                success: function(){
                    console.log("success!")
                },
                error: function(){console.log("error!")} 
            });
            return false;
    }
    if($("#html").val() != '') _handleSave();
    $("button.save").click(_postToCodeBlog);
});
