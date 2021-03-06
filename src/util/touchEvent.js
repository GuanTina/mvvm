  //touch事件相关
	var isPointer = navigator.msPointerEnabled;
	var start = "ontouchstart" in window ? "touchstart" : (isPointer ? "MSPointerDown" : "mousedown");
	var move = "ontouchmove" in window ? "touchmove" : (isPointer ? "MSPointerMove" : "mousemove");
	var end = "ontouchend" in window ? "touchend" : (isPointer ? "MSPointerUp" : "mouseup");
	var cancel = "ontouchcancel" in window ? "touchcancel" : "MSPointerCancel";
	if(window.PointerEvent) {
		start = "pointerdown";
		move = "pointermove";
		end = "pointerup";
		cancel = "pointercancel";
	} else if (window.MSPointerEvent) {
		start = "MSPointerDown";
		move = "MSPointerMove";
		end = "MSPointerUp";
	} 
	function getPoint (e) {
		if(e.originalEvent || e, "touchstart" == start) {
			if(!e.touches[0]) {
				return ;
			}
			e.x = e.touches[0].clientX;
			e.y = e.touches[0].clientY;
		} else {
			e.x = e.clientX;
			e.y = e.clientY;
		}
		return e;
	}
	module.exports =  {
		touchStart: start,
		touchMove : move,
		touchEnd : end,
		touchCancel : cancel,
		getPoint : getPoint
	};
