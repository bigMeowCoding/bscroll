(function (window,document,Math){
    function BScroll(el,options){

    }
    if(typeof module !=='undefined' && module.exports){
        module.exports = BScroll;
    } else if(typeof define === 'function' && define.amd){
        return BScroll
    } else {
        window.BScroll = BScroll;
    }
})(window,document,Math)