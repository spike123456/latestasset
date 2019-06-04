if (!app) {
	app = angular.module('SinglePage', []);
}

var couponApply="";
var cartStep=1;
var cacheCartData=[];
var totalBill=0;
var isExpress=false;
var isLoadingShip=false;
const deliveryRange={
	"1":{
		from:2,
		to:5,
		weight:1
	},
	"2":{
		from:7,
		to:10,
		weight:2
	},
	"3":{
		from:12,
		to:20,
		weight:3
	},
	"4":{
		from:22,
		to:35,
		weight:4
	},
	"5":{
		from:36,
		to:60,
		weight:5
	}
};

function getDeliveryTimeInText(startDate,deliveryId) {
	var begin=new Date();
	begin.setTime(startDate);
	if (deliveryId==0) { //today
		var now=new Date();
		if (now.getDate()==begin.getDate() && now.getMonth()==begin.getMonth() && now.getFullYear()==begin.getFullYear()) {
			return "Hôm nay";
		}

		return ""+begin.getDate()+"/"+(begin.getMonth()+1)+"/"+begin.getFullYear();
	}
	
	var rangeTarget=deliveryRange[deliveryId.toString()];
	begin.setTime(startDate+rangeTarget.from*24*60*60*1000);
	var end=new Date();
	end.setTime(startDate+rangeTarget.to*24*60*60*1000);

	return "Từ "+begin.getDate()+"/"+(begin.getMonth()+1)+"/"+begin.getFullYear()+" đến "+end.getDate()+"/"+(end.getMonth()+1)+"/"+end.getFullYear();
}

function getMaxDeliveryTime() {
	var itemIDs=localStorage.CartList;
	var ids=[];
	if (itemIDs!=null) {
		ids=itemIDs.split(",");
	}

	var max=JSON.parse(localStorage.getItem("Cart"+ids[0])).deliveryId;
	var now=new Date().getTime();

	for (i=1;i<ids.length;i++) {
		var item=JSON.parse(localStorage.getItem("Cart"+ids[i]));
		if (deliveryRange[item.deliveryId.toString()].weight>deliveryRange[max.toString()].weight) {
			max=item.deliveryId;
		}
	}

	return getDeliveryTimeInText(now,max);
}

function onUpdateCartOption(e,isCityChange) {
	e.style.cssText="color: black !important;";
	if (isCityChange) {
		var scope = angular.element(document.getElementById('cart-modal')).scope();
		scope.getDistrict();
	}
}

function goToStep() {
	$(".checkout-cart-step").css("display","none");
	$(".current-step").removeClass("current-step");
	$(".current-step-label").removeClass("current-step-label");
	$(".checkout-cart-step").get(cartStep-1).style.display="block";
	$(".checkout-step").get(cartStep-1).className += " current-step";
	$(".step-label").get(cartStep-1).className += " current-step-label";
}

function goNextStep(e) {
	var name=$("#name-address");
	var phone=$("#phone-address");
	var city=$("#cart-city-address-option");
	var district=$("#district-address");
	var ward=$("#ward-address");
	var main=$("#main-address");
	var note=$("#note-address");
	var option=$("#cart-address-option");
	var email=$("#email-address");

	switch (cartStep) {
		case 1:
		if (!localStorage.CartList) {
			showToast("error","Lỗi","Giỏ hàng trống");
			return;
		}
		
		name.val("");
		phone.val("");
		city.css("color","#81888f");
		city.val("");
		district.css("color","#81888f");
		district.html('<option value="" disabled selected>Quận/Huyện</option>');
		district.val("");
		ward.val("");
		option.css("color","#81888f");
		option.val("");
		main.val("");
		email.val("");
		note.val("");
		break;
		case 2:
		if (!name.val()) {
			showToast("error","Lỗi","Tên không hợp lệ");
			return;
		}

		if (!phone.val() || !isValidPhone(phone.val())) {
			showToast("error","Lỗi","Số điện thoại không hợp lệ");
			return;
		}

		if (!validateEmail(email.val())) {
			showToast("error","Lỗi","Email không hợp lệ");
			return;
		}

		if (!city.val()) {
			showToast("error","Lỗi","Tỉnh/Thành phố không hợp lệ");
			return;
		}

		if (!district.val()) {
			showToast("error","Lỗi","Quận/Huyện không hợp lệ");
			return;
		}

		if (!ward.val()) {
			showToast("error","Lỗi","Phường/Xã không hợp lệ");
			return;
		}

		if (!option.val()) {
			showToast("error","Lỗi","Loại địa chỉ không hợp lệ");
			return;
		}

		if (!main.val()) {
			showToast("error","Lỗi","Địa chỉ không hợp lệ");
			return;
		}

		$("#promotion").val("");
		$('input[name="payment-option"]').prop('checked', false);
		$(".detail-info-payment").css("display","none");
		$(".detail-info-payment").get(0).style.display="block";
		$("#review-info-tray").html("<b>Họ và tên: </b>"+name.val()+"<br>"+
			"<b>Điện thoại di động: </b>"+phone.val()+"<br>"+
			"<b>Email: </b>"+email.val()+"<br>"+
			"<b>Tỉnh/Thành phố: </b>"+$("#cart-city-address-option option:selected").text()+"<br>"+
			"<b>Quận/Huyện: </b>"+$("#district-address option:selected").text()+"<br>"+
			"<b>Phường/Xã: </b>"+ward.val()+"<br>"+
			"<b>Loại địa chỉ: </b>"+$("#cart-address-option option:selected").text()+"<br>"+
			"<b>Địa chỉ: </b>"+main.val()+ "<br>"+
			"<b>Thời gian giao hàng: </b><span id='date-delivery'>"+getMaxDeliveryTime()+"</span>"+(note.val()=='' ? '':('<br><b>Ghi chú: </b>'+note.val())));
		$("#phone-bank").html(phone.val());
		var scope = angular.element(document.getElementById('cart-modal')).scope();
		scope.getAllShip();
		break;
		case 3:
		var paymentOption=$('input[name=payment-option]:checked').val();
		if (paymentOption===undefined) {
			showToast("error","Lỗi","Xin vui lòng chọn hình thức thanh toán");
		}
		else if (isLoadingShip) {
			showToast("error","Đơn hàng","Đang tải dữ liệu. Xin vui lòng thử lại trong giây lát");
		}
		else {
			$('#cart-modal').data('bs.modal').backdrop = 'static';
			$('#cart-modal').data('bs.modal')._config.backdrop = 'static';
			$('#cart-modal').data('bs.modal').keyboard = true;
			$("#main-footer-modal").css("display","none");
			$("#processing").css("display","block");
			postNewBill();
		}
		return;
		default:
		break;
	}

	cartStep++;
	goToStep();
	e.innerHTML=cartStep===3?"ĐẶT HÀNG":"TIẾP TỤC";
}

function postNewBill() {
	var scope = angular.element(document.getElementById('bill')).scope();
	scope.send();
}

function validateEmail(email) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test(email.toLowerCase());
}

$('input[name=payment-option]').change(function() {
	$(".detail-info-payment").css("display","none");
	$(".detail-info-payment").get(parseInt(this.value)+1).style.display="block";
});

function isNumeric(num) {
	return !isNaN(num);
}

function isValidPhone(num) {
	var regex= /(0|84|\+84)[0-9]{9}/g;
	if (!regex.test(num)) {
		return false;
	}

	if (num.startsWith('0')) {
		num=num.substring(1);
	}
	else if (num.startsWith('84')) {
		num=num.substring(2);
	}
	else if (num.startsWith('+84')) {
		num=num.substring(3);
	}

	var prefix=['120','121','122','126','128','123','124','125','127','129','162','163','164','165','166','167','168','169','186','188','199'];
	for (var i = 0; i <prefix.length; i++) {
		if (num.startsWith(prefix[i])) {
			return false;
		}
	}
	
	return true;
}

function showToast(type,title,message) {
	toastr.options = {
		"closeButton": true,
		"debug": false,
		"newestOnTop": false,
		"progressBar": false,
		"positionClass": "toast-bottom-right",
		"preventDuplicates": false,
		"onclick": null,
		"showDuration": "300",
		"hideDuration": "1000",
		"timeOut": "5000",
		"extendedTimeOut": "1000",
		"showEasing": "swing",
		"hideEasing": "linear",
		"showMethod": "fadeIn",
		"hideMethod": "fadeOut"
	};

	toastr[type](message,title);
}


app.controller('cartController', function($scope,$http) {
	$scope.cacheCart=[];
	$scope.totalFee="...";
	$scope.shipFee="";
	$scope.discountFeeInTxt="0";
	$scope.expressFee=0;
	$scope.discountFee=0;
	$scope.normalFee=0;

	$(".cartBtn").click(function() {
		if (localStorage.currentPriceVersion && localStorage.currentPriceVersion!=versionAsset.general.price) {
     		showToast("error","Lỗi","Chúng tôi đang cập nhật lại dữ liệu. Xin vui lòng thử lại trong giây lát");
     		return;
		}
		cartStep=0;
		var itemIDs=localStorage.CartList;
		var ids=[];
		if (itemIDs!=null) {
			ids=itemIDs.split(",");
		}

		var arr=[];
		for (var i = 0; i <ids.length; i++) {
			var item=localStorage.getItem("Cart"+ids[i]);
			var newItem=JSON.parse(item);
			newItem.id=ids[i];
			arr.push(newItem);
		}

		$scope.cacheCart=arr;
		cacheCartData=arr;
		$scope.$apply();
		goNextStep(document.getElementsByClassName("confirm-modal")[0]);
		$("#main-footer-modal").css("display","block");
		$("#processing").css("display","none");

		$('#cart-modal').modal('show');
	});

	$scope.formatPrice = function(num) {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	$scope.onQuantityChanged = function(indexParent,newValue) {
		var item=$scope.cacheCart[indexParent];
		item.count=newValue;
		$scope.$apply();
		var oldId=item.id;
		delete item.id;
		localStorage.setItem("Cart"+oldId, JSON.stringify(item));
		item.id=oldId;
	};

	$scope.calculateWeight = function() {
		var weight=0;
		for (var i = 0; i <$scope.cacheCart.length; i++) {
			var item=$scope.cacheCart[i];
			weight+=(item.count*item.weight);
		}

		return weight;
	};

	$scope.calculateTotal = function() {
		var total=0;
		for (var i = 0; i <$scope.cacheCart.length; i++) {
			var item=$scope.cacheCart[i];
			total+=(item.count*item.price);
		}

		return total;
	};

	$scope.countTotal = function() {
		var total=0;
		for (var i = 0; i <$scope.cacheCart.length; i++) {
			var item=$scope.cacheCart[i];
			total+=item.count;
		}

		return total;
	};

	$scope.delete = function(index) {
		var idDelete=$scope.cacheCart[index].id;
		$scope.cacheCart.splice(index,1);
		var detailId=JSON.parse(localStorage.getItem("Cart"+idDelete)).detailId;
		localStorage.removeItem("Cart"+idDelete);

		var itemIDs=localStorage.CartList;
		var ids=[];
		if (itemIDs!=null) {
			ids=itemIDs.split(",");
		}

		ids.splice(ids.indexOf(idDelete),1);

		if (ids.length==0) {
			localStorage.removeItem("CartList");
		}
		else {
			localStorage.setItem("CartList", ids.join(","));
		}

		productLikeOrOrder(detailId);
	};

	$scope.getDistrict= function() {
		$http({
			method: 'GET',
			url: "https://data.doraeshop.vn/quan-huyen/"+$("#cart-city-address-option").val()+".json",
			headers: {
				'Content-Type': 'application/json; charset=utf-8'
			}})
		.then(function(response) {
			var data=response.data;
			var district=$("#district-address");
			district.css("color","#81888f");
			district.html('<option value="" disabled selected>Quận/Huyện</option>');
			Object.keys(data).forEach(function(key) {
				district.append('<option value="'+data[key].name_with_type+'">'+data[key].name_with_type+'</option>');
			});
			district.val("");
		});
	};

	$scope.formatShipFee= function(fee) {
		totalBill=fee+$scope.calculateTotal()-$scope.discountFee;
		$scope.shipFee=fee==0 ? "Miễn phí":($scope.formatPrice(fee*1000)+" đ");
		$scope.totalFee=$scope.formatPrice(totalBill)+",000 đ";
	};

	$scope.getNormalShipFee= function() {
		return new Promise(function(resolve, reject) {
			$http({
				method: 'POST',
				url: "https://api.doraeshop.vn/v1/search-ghtk-fee",
				data: {
					district:$("#district-address option:selected").text(),
					city:$("#cart-city-address-option option:selected").text(),
					weight:$scope.calculateWeight(),
					bill:$scope.calculateTotal()
				},
				headers: {
					'Content-Type': 'text/plain; charset=utf-8'
				}})
			.then(function(response) {
				if (response.data.code==200) {
					if (response.data.data.willDelivery) {
						$scope.normalFee=response.data.data.fee;
						$scope.formatShipFee($scope.normalFee);
					}
					else {
						$scope.shipFee=+"Không xác định";
					}
				}
				else {
					$scope.shipFee=+"Không xác định";
				}
				resolve(true);
			});
		});
	};

	$scope.getExpressShipFee= function() {
		var paramUrl=localStorage.expressId==null? "":("?expressId="+localStorage.expressId);
		return new Promise(function(resolve, reject) {
			$http({
				method: 'POST',
				url: "https://api.doraeshop.vn/v1/get-express-fee"+paramUrl,
				data: {
					district:$("#district-address option:selected").text(),
					address:$("#main-address").val()
				},
				headers: {
					'Content-Type': 'text/plain; charset=utf-8'
				}})
			.then(function(response) {
				var code=response.data.code;
				switch (code) {
					case 200:
					$("#express-delivery-question").css("display","block");
					$("#apply-express-btn").text("Áp dụng");
					$scope.expressFee=response.data.data.fee;
					localStorage.setItem('expressId',response.data.data.expressId);
					break;
					default:
					if (code==700) {
						localStorage.removeItem("expressId");
					}
					$("#express-delivery-question").css("display","none");
					break;
				}
				resolve(true);
			});
		});
	};

	$scope.isExpressAvailable= function() {
		for (var i = 0; i <$scope.cacheCart.length; i++) {
			if (!$scope.cacheCart[i].isExpressSupport) {
				return false;
			}
		}

		if ($("#cart-city-address-option").val()!='79') {
			return false;
		}

		var now=new Date();
		return now.getHours()*60+now.getMinutes()<=16*60+45;
	};

	$scope.getAllShip= function() {
		isLoadingShip=true;
		$("#loading-review").css("display","block");
		$("#review-order-info").css("display","none");
		isExpress=false;
		$("#express-delivery-note").css("display","none");
		$("#promotion-note").css("display","none");
		$scope.discountFee=0;
		$scope.discountFeeInTxt="0";
		$("#express-delivery-question").css("display","none");
		$scope.totalFee="...";
		couponApply="";

		var allTask=[$scope.getNormalShipFee()];
		if ($scope.isExpressAvailable()) {
			allTask.push($scope.getExpressShipFee());
		}

		Promise.all(allTask).then(function(values) {
			$("#loading-review").css("display","none");
			$("#review-order-info").css("display","block");
			isLoadingShip=false;
		});
	};

	$scope.toggleExpress= function() {
		isExpress=!isExpress;
		if (isExpress) {
			$("#apply-express-btn").text("Bỏ áp dụng");
			$("#date-delivery").text("Hôm nay");
			$("#express-delivery-note").css("display","table-row");
			$scope.formatShipFee($scope.expressFee);
		}
		else {
			$("#apply-express-btn").text("Áp dụng");
			$("#date-delivery").text(getMaxDeliveryTime());
			$("#express-delivery-note").css("display","none");
			$scope.formatShipFee($scope.normalFee);
		}
	};

	$scope.removeCoupon= function() {
		$scope.discountFee=0;
		$scope.discountFeeInTxt="0";
		$scope.formatShipFee(isExpress? $scope.expressFee : $scope.normalFee);
		showToast("success","Thông báo","Gỡ mã giảm giá thành công");
		$("#promotion-note").css("display","none");
		couponApply="";
	};

	$scope.sendCoupon= function() {
		var coupon=$("#promotion").val();
		if (coupon) {
			if (coupon.includes(' ')) {
				showToast("error","Lỗi","Mã giảm giá không hợp lệ");
			}
			else {
				$("#loading-review").css("display","block");
				$("#review-order-info").css("display","none");
				isLoadingShip=true;

				var itemArr=[];
				for (var i = 0; i < cacheCartData.length; i++) {
					itemArr.push({
						"id":cacheCartData[i].detailId,
						"quantity":cacheCartData[i].count,
						"typeOption":cacheCartData[i].cacheOption,
						"price":cacheCartData[i].price
					});
				}

				$http({
					method: 'POST',
					url: "https://api.doraeshop.vn/v1/estimate-discount",
					data: {
						items: itemArr,
						phone: $("#phone-address").val(),
						city: $("#cart-city-address-option option:selected").text(),
						code: coupon
					},
					headers: {
						'Content-Type': 'text/plain; charset=utf-8'
					}})
				.then(function(response) {
					var code=response.data.code;
					if (code==200) {
						$scope.discountFee=response.data.data;
						$scope.discountFeeInTxt='-'+$scope.formatPrice($scope.discountFee*1000);
						$("#promotion-note").css("display","block");
						$("#promotion").val("");
						couponApply=coupon;
					}
					else {
						$scope.discountFee=0;
						$scope.discountFeeInTxt='0';
						$("#promotion-note").css("display","none");
						couponApply="";
					}

					switch (code) {
						case 200:
						showToast("success","Thông báo","Kích hoạt thành công mã giảm giá");
						$("#main-promotion-code").text(coupon);
						break;
						case 999:
						showToast("error","Lỗi","Quý khách không thuộc đối tượng khuyến mãi của mã giảm giá này");
						break;
						case 1000:
						showToast("error","Lỗi","Mã giảm giá không hợp lệ");
						break;
						case 1001:
						showToast("error","Lỗi","Rất tiếc mã giảm giá này đã hết số lượng. Xin vui lòng sử dụng mã khác");
						break;
						case 1002:
						showToast("error","Lỗi","Chưa đến thời gian được khuyến mãi");
						break;
						case 1003:
						showToast("error","Lỗi","Mã giảm giá này đã hết hạn sử dụng");
						break;
						default:
						break;
					}

					$("#loading-review").css("display","none");
					$("#review-order-info").css("display","block");
					$scope.formatShipFee(isExpress? $scope.expressFee : $scope.normalFee);
					isLoadingShip=false;
				});
			}
		}
		else {
			showToast("error","Lỗi","Xin mời nhập mã giảm giá");
		}
	};

	var arrTemp=[];
	for (var i = 0; i <50; i++) {
		arrTemp.push(i+1);
	}
	$scope.quantity=arrTemp;
});


function onQuantityChangedPlain(e) {
	var scope = angular.element(e).scope();
	scope.onQuantityChanged($(".cart-select").index(e),$(e).prop('selectedIndex')+1);
}


function generatePagingArr(totalPages,currentPage) {
	var arr=[];
	if (totalPages<=5) {
		for (var i = 1; i <=totalPages; i++) {
			arr.push(i);
		}
	}
	else if (totalPages-currentPage<=1) {
		for (var i = totalPages-4; i <=totalPages; i++) {
			arr.push(i);
		}
	}
	else {
		var startIndex=currentPage-2<=0?1:currentPage-2;
		for (var i = startIndex; i <=startIndex+4; i++) {
			arr.push(i);
		}
	}

	return arr;
}

app.controller('pagingController', function($scope,$rootScope) {
	$scope.updatePaging = function(currentPage) {
		if ($scope.currentPage!=currentPage) {
			$scope.currentPage=currentPage;
			$scope.pagingArr=generatePagingArr($scope.totalPages,$scope.currentPage);
			$rootScope.$broadcast('onPageChanged', {
				page:currentPage-1
			});
		}
	};

	$scope.back = function() {
		if ($scope.currentPage!=1) {
			$scope.updatePaging($scope.currentPage-1);
		}
	};

	$scope.next = function() {
		if ($scope.currentPage!=$scope.totalPages) {
			$scope.updatePaging($scope.currentPage+1);
		}
	};

	$scope.$on('paging', function(event, args) {
		$scope.totalPages=args.total;
		$scope.currentPage=args.current;
		$scope.pagingArr=generatePagingArr($scope.totalPages,$scope.currentPage);
		$scope.$apply();
	});
});

app.controller('statusController', function($scope,$http) {
	$http({
		method: 'GET',
		url: "https://data.doraeshop.vn/api/v1/highlight-article"+versionAsset.general.hightlightArticle+".json",
		headers: {
			'Content-Type': 'application/json; charset=utf-8'
		}})
	.then(function(response) {
		var statusData=response.data.data;
		var html="";
		for (i = 0; i < statusData.length; i++) {
			html+='<a href="'+statusData[i].url+'" onclick="customGA(\'Header\', \'ArticleClick\', \''+statusData[i].title+'\');">'+statusData[i].title+'</a>';
		}

		$('.marquee').html(html).marquee({
            //duration in milliseconds of the marquee
            duration: 10000 +(($('.marquee').width()-300)*20000/1100),
            //gap in pixels between the tickers
            gap: 50,
            //time in milliseconds before the marquee will start animating
            delayBeforeStart: 0,
            //'left' or 'right'
            direction: 'left',
            //true or false - should the marquee be duplicated to show an effect of continues flow
            duplicated: true,
            pauseOnHover:true
        });
	});

	//check price version
	var serverPriceVersion=versionAsset.general.price;
	if (localStorage.currentPriceVersion) {
		if (localStorage.currentPriceVersion!=serverPriceVersion) {
			$http({
				method: 'GET',
				url: "https://data.doraeshop.vn/api/v1/product"+serverPriceVersion+".json",
				headers: {
					'Content-Type': 'application/json; charset=utf-8'
				}})
			.then(function(response) {
				var data=response.data.data;

				// cart
				var itemIDs=localStorage.CartList;
				var ids=[];
				if (itemIDs!=null) {
					ids=itemIDs.split(",");
				}

				for (var i = 0; i <ids.length; i++) {
					var item=JSON.parse(localStorage.getItem("Cart"+ids[i]));
					if (data.hasOwnProperty(item.detailId.toString())) {
						var newItem=data[item.detailId.toString()];
						if (item.cacheOption) {
							item.price=newItem.optionPrice[item.cacheOption].price;
						}
						else {
							item.price=newItem.price;
						}
					}

					localStorage.setItem("Cart"+ids[i], JSON.stringify(item));
				}

				// favorite
				itemIDs=localStorage.FavoriteList;
				ids=[];
				if (itemIDs!=null) {
					ids=itemIDs.split(",");
				}

				for (var i = 0; i <ids.length; i++) {
					if (data.hasOwnProperty(ids[i])) {
						var item=JSON.parse(localStorage.getItem("Favorite"+ids[i]));
						var newItem=data[ids[i]];
						item.price=newItem.price;
						item.realPrice=newItem.realPrice;
						item.discountPercent=newItem.discountPercent;
						localStorage.setItem("Favorite"+ids[i], JSON.stringify(item));
					}
				}

				localStorage.setItem('currentPriceVersion',serverPriceVersion);
			});
		}
	}
	else {
		localStorage.setItem('currentPriceVersion',serverPriceVersion);
	}
});



app.controller('billController', function($scope,$http) {
	$scope.send= function() {
		var sendObj={
			"info":{
				"name":$("#name-address").val(),
				"phone":$("#phone-address").val(),
				"email":$("#email-address").val(),
				"city":$("#cart-city-address-option option:selected").text(),
				"district":$("#district-address option:selected").text(),
				"ward":$("#ward-address").val(),
				"addressType":$("#cart-address-option option:selected").text(),
				"address":$("#main-address").val(),
				"note":$("#note-address").val()
			},
			"paymentMethod":($('input[name=payment-option]:checked').val()=='0' ? 'cod':'bank'),
			"items":[]
		};

		if (isExpress) {
			sendObj.expressId=localStorage.expressId;
		}

		if (couponApply) {
			sendObj.code=couponApply;
		}

		for (var i = 0; i < cacheCartData.length; i++) {
			sendObj.items.push({
				"id":cacheCartData[i].detailId,
				"quantity":cacheCartData[i].count,
				"typeOption":cacheCartData[i].cacheOption,
				"extra":cacheCartData[i].extra
			});
		}

		$http({
			method: 'POST',
			url: "https://api.doraeshop.vn/v1/create-bill",
			data: sendObj,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8'
			}})
		.then(function(response) {
			var code=response.data.code;
			$('#cart-modal').data('bs.modal').backdrop = true;
			$('#cart-modal').data('bs.modal')._config.backdrop = true;
			$('#cart-modal').data('bs.modal').keyboard = false;
			$("#main-footer-modal").css("display","block");
			$("#processing").css("display","none");
			$('#cart-modal').modal('hide');
			if (code==200) {
				if (isExpress) {
					localStorage.removeItem("expressId");
				}
				customGA('Header', 'Cart', 'Success');
				showToast("success","Đơn hàng","Tạo đơn hàng thành công. Vui lòng kiểm tra email");
				var itemIDs=localStorage.CartList;
				var ids=[];
				if (itemIDs!=null) {
					ids=itemIDs.split(",");
				}

				var arrProductIds=[];
				for (var i = 0; i <ids.length; i++) {
					var detailId=JSON.parse(localStorage.getItem("Cart"+ids[i])).detailId.toString();
					if (!arrProductIds.includes(detailId)) {
						arrProductIds.push(detailId);
					}
					localStorage.removeItem("Cart"+ids[i]);
				}
				localStorage.removeItem("CartList");

				makeOneSignal(function() {
					OneSignal.getTags(function(tags) {
						var bought= (tags.bought) ? parseInt(tags.bought) : 0;
						var budget= (tags.budget) ? parseInt(tags.budget) : 0;

						var map={
							"bought": bought+1,
							"budget": budget+totalBill
						};

						var arrInterestIds=[];
						for (var i = 0; i <arrProductIds.length; i++) {
							map["asset"+arrProductIds[i]]=new Date().getTime();
							if (!isFavoriteExistWithThisPage(arrProductIds[i]) && tags.hasOwnProperty("interest"+arrProductIds[i])) {
								arrInterestIds.push("interest"+arrProductIds[i]);
							}
						}

						OneSignal.sendTags(map);
						OneSignal.deleteTags(arrInterestIds);
					});
				});
			}
			else {
				customGA('Header', 'Cart', 'Fail');
				if (code==1005) {
					showToast("error","Đơn hàng",response.data.message);
				}
				else {
					showToast("error","Đơn hàng","Tạo đơn hàng thất bại");
				}
			}
		});
	};
});


app.controller('orderDetailController', function($scope,$http) {
	$scope.date="";
	$scope.status="";
	$scope.phone="";
	$scope.subTotal="";
	$scope.address="";
	$scope.shipFee="";
	$scope.total="";

	$scope.formatPrice = function(num) {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	$scope.checkOrder= function() {
		var id=$("#order-input").val().trim();
		if (id.length!=10) {
			showToast("error","Lỗi","Mã đơn hàng không hợp lệ");
		}
		else {
			$("#loading-order").css("display","block");
			$("#result-order-search").css("display","none");
			$("#not-found-order").css("display","none");
			$http({
				method: 'GET',
				url: "https://api.doraeshop.vn/v1/get-order-detail?id="+id,
				headers: {
					'Content-Type': 'application/json; charset=utf-8'
				}})
			.then(function(response) {
				var code=response.data.code;
				$("#loading-order").css("display","none");
				if (code==200) {
					customGA('Header', 'CheckOrder', 'Success');
					var data=response.data.data;
					$("#result-order-search").css("display","block");
					$("#summary-result").html("Mã đơn hàng: "+id+"<br>Họ và tên: "+data.name+"<br>Email: "+data.email+(data.note ? ("<br>Ghi chú: "+data.note):""));
					$scope.phone=data.phone;
					$scope.subTotal=$scope.formatPrice(data.subTotal)+',000';
					$scope.address=data.address;
					if (data.shipFee==-1) {
						$scope.shipFee="Chờ xác nhận";
					}
					else {
						$scope.shipFee=$scope.formatPrice(data.shipFee*1000);
					}
					$scope.discount=data.discount==0 ? '0' : ('-'+$scope.formatPrice(data.discount)+',000');
					$scope.total=$scope.formatPrice((data.shipFee==-1? 0:data.shipFee)+data.subTotal-data.discount)+",000 đồng";
					var time=new Date();
					time.setTime(data.time);
					$scope.deliveryText=getDeliveryTimeInText(data.time,data.deliveryTime);
					$scope.date=""+time.getDate()+"/"+(time.getMonth()+1)+"/"+time.getFullYear();
					switch (data.status) {
						case 'init':
						$scope.status="Vừa khởi tạo";
						break;
						case 'confirm':
						$scope.status="Đã xác nhận";
						break;
						case 'transport':
						$scope.status="Trong quá trình xử lý";
						break;
						case 'delivery':
						$scope.status="Đang giao hàng";
						break;
						case 'finish':
						$scope.status="Giao hàng thành công";
						break;
						case 'canceled':
						$scope.status="Đã huỷ";
						break;
					}
					$scope.$apply();
				}
				else {
					customGA('Header', 'CheckOrder', 'Fail');
					$("#not-found-order").css("display","block");
					$("#not-found-order").text("Không tìm thấy đơn hàng "+id);
				}
			});
		}
	};
});



function generateKeyword(keyword) {
	var validCharacter="qwertyuiopasdfghjklzxcvbnméèẻẽẹêếềểễệýỳỷỹỵúùủũụưứừửữựíìỉĩịóòỏõọôốồổỗộơớờởỡợáàảãạâấầẩẫậăắằẳẵặđ";
	var result="";
	for (var i = 0; i < keyword.length; i++) {
		var item=keyword.charAt(i);
		if (item.includes(' ')) {
			result+='+';
		}
		else if (validCharacter.includes(item.toLowerCase())) {
			result+=item;
		}
		else {
			result+=encodeURIComponent(item);
		}
	}

	return result;
}

function search(id) {
	var keyword=$('#'+id).val();
	if (keyword) {
		customGA('Header', 'Search', keyword);
		window.location.href="/tim-kiem?q="+generateKeyword(keyword);
	}
}


function openDialogBroadcast(item)
{
	localStorage.setItem('message',item);
	localStorage.removeItem('message');
}


function dialogReceive(ev)
{
	if (ev.originalEvent.key=='message') {
		switch (ev.originalEvent.newValue) {
			case 'cart':
			$('#cart-modal').modal('hide');
			break;
			case 'favorite':
			$('#favorite-modal').modal('hide');
			break;
		}
	}
}
$(window).on('storage', dialogReceive);


$('#cart-modal').on('show.bs.modal', function (e) {
	openDialogBroadcast('cart');
});


$('#order-modal').on('show.bs.modal', function (e) {
	$("#loading-order").css("display","none");
	$("#result-order-search").css("display","none");
	$("#not-found-order").css("display","none");
	$("#order-input").val("");
});


app.controller('favoriteController', function($scope) {
	$scope.favoriteList=[];

	$(".favoriteBtn").click(function() {
		if (localStorage.currentPriceVersion && localStorage.currentPriceVersion!=versionAsset.general.price) {
     		showToast("error","Lỗi","Chúng tôi đang cập nhật lại dữ liệu. Xin vui lòng thử lại trong giây lát");
     		return;
		}

		customGA('Header', 'Favorite', 'View');
		var itemIDs=localStorage.FavoriteList;
		var ids=[];
		if (itemIDs!=null) {
			ids=itemIDs.split(",");
		}

		var arr=[];
		for (var i = 0; i <ids.length; i++) {
			arr.push(JSON.parse(localStorage.getItem("Favorite"+ids[i])));
		}

		$scope.favoriteList=arr;
		$scope.$apply();
		if (arr.length==0) {
			$("#favorite-empty").css("display","block");
			$("#favorite-content").css("display","none");
		}
		else {
			$("#favorite-empty").css("display","none");
			$("#favorite-content").css("display","block");
		}

		$('#favorite-modal').modal('show');
	});

	$scope.formatPrice = function(num) {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	};

	$scope.gaSend = function() {
		customGA('Header', 'Favorite', 'ItemClick');
	};
});


function isFavoriteProduct(id) {
	var itemIDs=localStorage.FavoriteList;
	var ids=[];
	if (itemIDs!=null) {
		ids=itemIDs.split(",");
	}

	return ids.includes(id.toString());
}


function customGA(category,action,label) {
	if (localStorage.admin===undefined) {
		ga('send', 'event', category, action, label);
	}
}


app.controller('locationController', function($scope,$http) {
	$scope.getCoordination = function() {
		$http({
			method: 'POST',
			url: "https://www.googleapis.com/geolocation/v1/geolocate?key=AIzaSyD9axwXb0Gkx_q7CZgFPVhZlurDiDQlCJw",
			headers: {
				'Content-Type': 'application/json; charset=utf-8'
			}})
		.then(function(response) {
			var location=response.data.location;
			if (location && location.lat && location.lng) {
				$scope.getProvince(location.lat,location.lng);
			}
		});
	};

	$scope.getProvince = function(lat,lng) {
		$http({
			method: 'GET',
			url: "https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+lng+"&sensor=true&key=AIzaSyD9axwXb0Gkx_q7CZgFPVhZlurDiDQlCJw",
			headers: {
				'Content-Type': 'application/json; charset=utf-8'
			}})
		.then(function(response) {
			var results=response.data.results;

			if (results && results.length!=0 && results[0].address_components && results[0].address_components.length!=0) {
				var current=results[0].address_components;

				for (var i = 0; i <current.length; i++) {
					if (current[i].types && current[i].types.includes("administrative_area_level_1")) {
						var province=current[i].long_name;

						if (province) {
							province=replaceAll(province," ","");
							var vietnamese={"é":"e","è":"e","ẻ":"e","ẽ":"e","ẹ":"e","ê":"e","ế":"e","ề":"e","ể":"e","ễ":"e","ệ":"e","ý":"y","ỳ":"y","ỷ":"y","ỹ":"y","ỵ":"y","ú":"u",
							"ù":"u","ủ":"u","ũ":"u","ụ":"u","ư":"u","ứ":"u","ừ":"u","ử":"u","ữ":"u","ự":"u","í":"i","ì":"i","ỉ":"i","ĩ":"i","ị":"i","ó":"o","ò":"o",
							"ỏ":"o","õ":"o","ọ":"o","ô":"o","ố":"o","ồ":"o","ổ":"o","ỗ":"o","ộ":"o","ơ":"o","ớ":"o","ờ":"o","ở":"o","ỡ":"o","ợ":"o","á":"a","à":"a",
							"ả":"a","ã":"a","ạ":"a","â":"a","ấ":"a","ầ":"a","ẩ":"a","ẫ":"a","ậ":"a","ă":"a","ắ":"a","ằ":"a","ẳ":"a","ẵ":"a","ặ":"a","đ":"d","É":"E",
							"È":"E","Ẻ":"E","Ẽ":"E","Ẹ":"E","Ê":"E","Ế":"E","Ề":"E","Ể":"E","Ễ":"E","Ệ":"E","Ý":"Y","Ỳ":"Y","Ỷ":"Y","Ỹ":"Y","Ỵ":"Y","Ú":"U","Ù":"U",
							"Ủ":"U","Ũ":"U","Ụ":"U","Ư":"U","Ứ":"U","Ừ":"U","Ử":"U","Ữ":"U","Ự":"U","Í":"I","Ì":"I","Ỉ":"I","Ĩ":"I","Ị":"I","Ó":"O","Ò":"O","Ỏ":"O",
							"Õ":"O","Ọ":"O","Ô":"O","Ố":"O","Ồ":"O","Ổ":"O","Ỗ":"O","Ộ":"O","Ơ":"O","Ớ":"O","Ờ":"O","Ở":"O","Ỡ":"O","Ợ":"O","Á":"A","À":"A","Ả":"A",
							"Ã":"A","Ạ":"A","Â":"A","Ấ":"A","Ầ":"A","Ẩ":"A","Ẫ":"A","Ậ":"A","Ă":"A","Ắ":"A","Ằ":"A","Ẳ":"A","Ẵ":"A","Ặ":"A","Đ":"D"};

							var result="";
							for (var j = 0; j < province.length; j++) {
								var item=province.charAt(j);
								if (vietnamese.hasOwnProperty(item)) {
									result+=vietnamese[item];
								}
								else {
									result+=item;
								}
							}

							customGA("Location","Province",result);
							OneSignal.sendTags({
								"province":result
							},function(tagsSent) {
								localStorage.setItem("isLocationLoaded","true");
							});
						}
						break;
					}
				}
			}
		});
	};

	$scope.newChat = function() {
		$http({
			method: 'POST',
			url: "https://api.doraeshop.vn/v1/new-chat-notification",
			headers: {
				'Content-Type': 'application/json; charset=utf-8'
			}})
		.then(function(response) {
			
		});
	};
});

function replaceAll(str, find, replace) {
	return str.replace(new RegExp(find, 'g'), replace);
}

function locationFetch() {
	var scope = angular.element(document.getElementById('location-id')).scope();
	scope.getCoordination();
}

function deviceFetch() {
	var allTags={};
	var result = new UAParser().getResult();
	var md = new MobileDetect(window.navigator.userAgent);
	if (md.mobile()) {
		if (md.phone()) {
			allTags.deviceType="Phone";
		}
		else {
			allTags.deviceType="Tablet";
		}
	}
	else {
		allTags.deviceType="Desktop";
	}

	if (result.browser.name) {
		allTags.browser=result.browser.name;
	}

	if (result.os.name) {
		allTags.os=result.os.name;
	}

	if (categoryPage!=null) {
		allTags[categoryPage] = 1;
	}

	OneSignal.sendTags(allTags, function(tagsSent) {
		localStorage.setItem("isDeviceLoaded","true");
	});
}

function isCartExistWithThisPage(id) {
	var itemIDs=localStorage.CartList;
	var ids=[];
	if (itemIDs!=null) {
		ids=itemIDs.split(",");

		for (var i = 0; i <ids.length; i++) {
			if (JSON.parse(localStorage.getItem("Cart"+ids[i])).detailId===id) {
				return true;
			}
		}
	}

	return false;
}

function isFavoriteExistWithThisPage(id) {
	if (localStorage.FavoriteList!=null) {
		return localStorage.FavoriteList.includes(id.toString());
	}

	return false;
}

function productLikeOrOrder(id) {
	makeOneSignal(function() {
		OneSignal.getTags(function(tags) {
			if (isCartExistWithThisPage(id) || isFavoriteExistWithThisPage(id)) {
				if (!tags.hasOwnProperty("interest"+id)) {
					var map={};
					map["interest"+id]=new Date().getTime();
					OneSignal.sendTags(map);
				}
			}
			else if (tags.hasOwnProperty("interest"+id)) {
				OneSignal.deleteTag("interest"+id);
			}
		});
	});
}

function makeOneSignal(callback) {
	if (localStorage.isPushNotificationsEnabled!=null) {
		callback();
	}
	else {
		OneSignal.isPushNotificationsEnabled(function(isEnabled) {
			if (isEnabled) {
				localStorage.setItem("isPushNotificationsEnabled","true");
				callback();
			}
		});
	}
}

// var scope = angular.element(document.getElementById('location-id')).scope();
// 	scope.newChat();