
// Utility Functions
function RandNum(from, to) {
	return Math.random() * (to - from + 1) + from;
}

function RandInt(from, to) {
	return Math.floor(Math.random() * (to - from + 1) + from);
}

function RotateVectorByRad(v, rad) {
	var cs = Math.cos(rad);
	var sn = Math.sin(rad);
	var px = v.x * cs - v.y * sn; 
	var py = v.x * sn + v.y * cs;
	v.x = px;
	v.y = py;
}

function RotateVectorByDeg(v, deg) {
	var rad = DegToRad(deg);
	RotateVectorByRad(v, rad);
}

function intersectRectRect(left, top, right, bottom, otherLeft, otherTop, otherRight, otherBottom) {
	return !(left > otherRight || right < otherLeft || top > otherBottom || bottom < otherTop);
}

function intersectCircleAABB(Cx, Cy, Cradius, Rleft, Rtop, Rright, Rbottom) {
	var closestPointX = Cx;
	var closestPointY = Cy;

	if (Cx < Rleft) {
		closestPointX = Rleft;
	} else if (Cx > Rright) {
		closestPointX = Rright;
	}

	if (Cy < Rtop) {
		closestPointY = Rtop;
	} else if (Cy > Rbottom) {
		closestPointY = Rbottom;
	}

	var diffX = closestPointX - Cx;
	var diffY = closestPointY - Cy;

	if (diffX * diffX + diffY * diffY > Cradius * Cradius) {
		return null;
	}

	return [closestPointX, closestPointY];
}

function DrawHighlight(ctx) {
	ctx.save();
	ctx.beginPath();
	ctx.fillStyle = HighlightColor;
	ctx.beginPath();
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo((HighlightWidth / 2), -HighlightHeight);
	ctx.lineTo(-(HighlightWidth / 2), -HighlightHeight);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

const PercentageRegexp = /^(\d*)%/;
function ParseIntAsPotentialPercentage(input, maxValueIfPercentage) {
	var inputType = typeof input;
	switch (inputType) {
		case "number":
			return Math.floor(input);
		
		case "string":
		{
			var matches = input.match(PercentageRegexp);
			var isPercentage = false;
			if (matches && matches.length == 2) {
				input = matches[1];
				isPercentage = true;
			}
			
			var value = parseInt(input);
			if ( ! isNaN(value)) {
				if (isPercentage) {
					value = (value / 100.0) * maxValueIfPercentage;
				}
			}
			
			return Math.floor(value);
		}
		
		default:
			return Number.NaN;
	}
}
