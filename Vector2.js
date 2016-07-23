/**
 * Класс, описывающий двухмерный вектор
 *
 * Дополненная версия класса, описывающего вектор (x,y)
 * @original	https://github.com/sebleedelisle/JSTouchController/blob/master/js/Vector2.js
 */

var Vector2 = function (x,y) {
	this.x = x || 0; 
	this.y = y || 0; 
};

Vector2.prototype = {

	/**
	 * Обновление координат вектора
	 */
	reset: function ( x, y ) {
		this.x = x;
		this.y = y;
		return this;
	},
	/** 
	 * Обновление координат вектора путем указания угла
	 */
	resetAngle: function(angle, useRadians) {
		this.x = Math.cos(angle * (useRadians ? 1 : Vector2Const.TO_RADIANS));
		this.y = Math.sin(angle * (useRadians ? 1 : Vector2Const.TO_RADIANS));
	},
	/** 
	 * Функция возвращает вектор в виде строки
	 */
	toString : function (decPlaces) {
	 	decPlaces = decPlaces || 3; 
		var scalar = Math.pow(10,decPlaces); 
		return "[" + Math.round (this.x * scalar) / scalar + ", " + Math.round (this.y * scalar) / scalar + "]";
	},
	
	/** 
	 * Клонирует вектор в новый объект
	 */
	clone : function () {
		return new Vector2(this.x, this.y);
	},
	/** 
	 * Клонирует вектор в существующий объект
	 */
	copyTo : function (v) {
		v.x = this.x;
		v.y = this.y;
	},
	/** 
	 * Копирует значение другого вектора
	 */
	copyFrom : function (v) {
		this.x = v.x;
		this.y = v.y;
	},	
	/** 
	 * Вычисление магнитуды вектора (что бы это ни было) 
	 */
	magnitude : function () {
		return Math.sqrt((this.x*this.x)+(this.y*this.y));
	},
	
	magnitudeSquared : function () {
		return (this.x*this.x)+(this.y*this.y);
	},
	/** 
	 * Расстояние до другого вектора
	 */
	distanceTo: function(v) {
		return Math.sqrt(Math.pow(this.x-v.x, 2)+Math.pow(this.y-v.y, 2));
	},
	/** 
	 * Сумма вектора становится меньше или равна 1
	 */
	normalise : function () {
		
		var m = this.magnitude();
				
		this.x = this.x/m;
		this.y = this.y/m;

		return this;	
	},
	/** 
	 * Обращение вектора
	 */
	reverse : function () {
		this.x = -this.x;
		this.y = -this.y;
		
		return this; 
	},
	/** 
	 * Прибавляет знаечение вектора @var v в текущий объект
	 */
	plusEq : function (v) {
		this.x+=v.x;
		this.y+=v.y;
		
		return this; 
	},
	/** 
	 * Прибавляет значение вектора @var v и возвращает новый объект
	 */
	plusNew : function (v) {
		 return new Vector2(this.x+v.x, this.y+v.y); 
	},
	/** 
	 * Убавляет знаечение вектора @var v в текущий объект
	 */
	minusEq : function (v) {
		this.x-=v.x;
		this.y-=v.y;
		
		return this; 
	},
	/** 
	 * Убавляет значение вектора @var v и возвращает новый объект
	 */
	minusNew : function (v) {
	 	return new Vector2(this.x-v.x, this.y-v.y); 
	},	
	/** 
	 * Умножение векторов
	 */
	multiplyEq : function (scalar) {
		this.x*=scalar;
		this.y*=scalar;
		
		return this; 
	},
	multiplyNew : function (scalar) {
		var returnvec = this.clone();
		return returnvec.multiplyEq(scalar);
	},
	/** 
	 * Деление векторов
	 */
	divideEq : function (scalar) {
		this.x/=scalar;
		this.y/=scalar;
		return this; 
	},
	
	divideNew : function (scalar) {
		var returnvec = this.clone();
		return returnvec.divideEq(scalar);
	},
	/** 
	 * Скалярная сумма текущего вектора и вектора @var v
	 */
	dot : function (v) {
		return (this.x * v.x) + (this.y * v.y) ;
	},
	/** 
	 * Вычисление угла вектора
	 * @param bool useRadians	вычисление угла в радианах
	 */
	angle : function (useRadians) {
		return Math.atan2(this.y,this.x) * (useRadians ? 1 : Vector2Const.TO_DEGREES);
	},

	angleTo: function (vec, useRadians) {
		return Math.acos((this.x*vec.x+this.y*vec.y)/(Math.sqrt(this.x*this.x+this.y*this.y)*(Math.sqrt(vec.x*vec.x+vec.y*vec.y))))*(useRadians ? 1 : Vector2Const.TO_DEGREES);
	},
	
	rotate : function (angle, useRadians) {
		
		var cosRY = Math.cos(angle * (useRadians ? 1 : Vector2Const.TO_RADIANS));
		var sinRY = Math.sin(angle * (useRadians ? 1 : Vector2Const.TO_RADIANS));
	
		Vector2Const.temp.copyFrom(this); 

		this.x= (Vector2Const.temp.x*cosRY)-(Vector2Const.temp.y*sinRY);
		this.y= (Vector2Const.temp.x*sinRY)+(Vector2Const.temp.y*cosRY);
		
		return this; 
	},	
		
	equals : function (v) {
		return((this.x==v.x)&&(this.y==v.x));
	},
	
	isCloseTo : function (v, tolerance) {	
		if(this.equals(v)) return true;
		
		Vector2Const.temp.copyFrom(this); 
		Vector2Const.temp.minusEq(v); 
		
		return(Vector2Const.temp.magnitudeSquared() < tolerance*tolerance);
	},
	
	rotateAroundPoint : function (point, angle, useRadians) {
		Vector2Const.temp.copyFrom(this); 
		//trace("rotate around point "+t+" "+point+" " +angle);
		Vector2Const.temp.minusEq(point);
		//trace("after subtract "+t);
		Vector2Const.temp.rotate(angle, useRadians);
		//trace("after rotate "+t);
		Vector2Const.temp.plusEq(point);
		//trace("after add "+t);
		this.copyFrom(Vector2Const.temp);
		
	}, 
	
	isMagLessThan : function (distance) {
		return(this.magnitudeSquared()<distance*distance);
	},
	
	isMagGreaterThan : function (distance) {
		return(this.magnitudeSquared()>distance*distance);
	}
	
	
	// still AS3 to convert : 
	// public function projectOnto(v:Vector2) : Vector2
	// {
	// 		var dp:Number = dot(v);
	// 
	// 		var f:Number = dp / ( v.x*v.x + v.y*v.y );
	// 
	// 		return new Vector2( f*v.x , f*v.y);
	// 	}
	// 
	// 
	// public function convertToNormal():void
	// {
	// 	var tempx:Number = x; 
	// 	x = -y; 
	// 	y = tempx; 
	// 	
	// 	
	// }		
	// public function getNormal():Vector2
	// {
	// 	
	// 	return new Vector2(-y,x); 
	// 	
	// }
	// 
	// 
	// 
	// public function getClosestPointOnLine ( vectorposition : Point, targetpoint : Point ) : Point
	// {
	// 	var m1 : Number = y / x ;
	// 	var m2 : Number = x / -y ;
	// 	
	// 	var b1 : Number = vectorposition.y - ( m1 * vectorposition.x ) ;
	// 	var b2 : Number = targetpoint.y - ( m2 * targetpoint.x ) ;
	// 	
	// 	var cx : Number = ( b2 - b1 ) / ( m1 - m2 ) ;
	// 	var cy : Number = m1 * cx + b1 ;
	// 	
	// 	return new Point ( cx, cy ) ;
	// }
	// 

};

Vector2Const = {
	TO_DEGREES : 180 / Math.PI,		
	TO_RADIANS : Math.PI / 180,
	temp : new Vector2()
	};