var subCategoryIds={};
var subCategoryValues={};
var deliveryIds={};
var deliveryValues={};
for (i = 0; i < subCategoriesDictionary.length; i++) {
	subCategoryIds[subCategoriesDictionary[i].id]=subCategoriesDictionary[i].value;
	subCategoryValues[subCategoriesDictionary[i].value]=subCategoriesDictionary[i].id;
}

for (i = 0; i < deliveryDictionary.length; i++) {
	deliveryIds[deliveryDictionary[i].id]=deliveryDictionary[i].value;
	deliveryValues[deliveryDictionary[i].value]=deliveryDictionary[i].id;
}


var emptyFilter= $('#empty-filter');
var filterPanel= $('#filter-panel');
var labelNumberResult= $('#label-number-result');
var loadingProduct= $('#loading-product');
var emptyResult= $('#empty-result');
var labelsTag= $('#labels-tag');
var productResult= $('#product-panel-result');
var pagingPanel= $('#paging-panel');
var priceBar= $('#price-bar');
var orderBar= $('#order-bar');
var currentOrder=0;
var currentPriceFrom=50;
var currentPriceTo=5000;


$('.collapse').on('show.bs.collapse', function () {
	$('#' + $(this).attr('id') + '-arrow').removeClass("fa-chevron-down").addClass("fa-chevron-up");
}).on('hide.bs.collapse', function () {
	$('#' + $(this).attr('id') + '-arrow').removeClass("fa-chevron-up").addClass("fa-chevron-down");
});



function numberWithCommas(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}


priceBar.slider({}).on('change', function(e) {
	var mainValue=e.value.newValue;
	currentPriceFrom=mainValue[0];
	currentPriceTo=mainValue[1];
	$("#display-price").html("Từ "+numberWithCommas(currentPriceFrom)+".000<sup>đ</sup> đến "+numberWithCommas(currentPriceTo)+".000<sup>đ</sup>");
});

orderBar.slider({}).on('change', function(e) {
	currentOrder=e.value.newValue;
	$("#display-order").html("Lớn hơn "+currentOrder);
});


var app = angular.module('SinglePage', []);

app.controller('filterController', function($scope,$rootScope) {
	$scope.filterData= {
		"type":typePage,
		"subCategories":[],
		"brands":[],
		"deliveryTime":0,
		"booked":0,
		"rangePriceFrom":50,
		"rangePriceTo":5000,
		"page":0
	};

	$scope.subCategoryData=[];
	$scope.brandData=[];
	$scope.deliveryData=[];
	$scope.tagData=[];
	$scope.productItems=[];

	$scope.formatPrice = function(num) {
     	return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
 	};

	$scope.buildFilters = function() {
		var result=[];
		if ($scope.filterData.type!=0) {
			result.push("categoryId:"+$scope.filterData.type);
		}

		var filterCategories=$scope.filterData.subCategories;
		var subResult=[];
		for (i = 0; i < filterCategories.length; i++) {
			subResult.push("subCategoryId:"+filterCategories[i]);
		}
		if (subResult.length!=0) {
			result.push("("+subResult.join(" OR ")+")");
		}


		var filterBrands=$scope.filterData.brands;
		subResult=[];
		for (i = 0; i < filterBrands.length; i++) {
			customGA('ResultSearch', 'Brand', filterBrands[i]);
			subResult.push("brand:\""+filterBrands[i]+"\"");
		}
		if (subResult.length!=0) {
			result.push("("+subResult.join(" OR ")+")");
		}


		if ($scope.filterData.deliveryTime!=0) {
			result.push("deliveryTimeId:"+$scope.filterData.deliveryTime);
		}
		if ($scope.filterData.booked!=0) {
			result.push("booked>"+$scope.filterData.booked);
		}
		if ($scope.filterData.rangePriceFrom!=50 || $scope.filterData.rangePriceTo!=5000) {
			result.push("price>="+$scope.filterData.rangePriceFrom);
			result.push("price<="+$scope.filterData.rangePriceTo);
		}

		return result.join(" AND ");
	};

	$scope.performSearch = function() {
		var optionSearch= $("#sort-option").prop('selectedIndex');
		switch (optionSearch) {
			case 0:
			customGA('ResultSearch', 'Sort', 'Newest');
			break;
			case 1:
			customGA('ResultSearch', 'Sort', 'Highest');
			break;
			case 2:
			customGA('ResultSearch', 'Sort', 'Lowest');
			break;
			case 3:
			customGA('ResultSearch', 'Sort', 'BestSeller');
			break;
			case 4:
			customGA('ResultSearch', 'Sort', 'BestPromotion');
			break;
		}
		var client = algoliasearch(authAlgolia[optionSearch].appId, authAlgolia[optionSearch].apiKey);
		var index = client.initIndex('product');

		var start=new Date().getTime();
		index.search(
		{
			query: keyword,
			filters: $scope.buildFilters(),
			attributesToRetrieve: ['url', 'mainImage', 'discountPercent', 'title', 'price', 'realPrice', 'booked', 'id'],
			page: $scope.filterData.page,
			hitsPerPage: 24,
			facets: ['deliveryTime', 'subCategoryName', 'brand']
		},
		function searchDone(err, content) {
			if (err) {
				console.error(err);
				return;
			}

			var arr=[];
			var total=content.nbHits;
			for (var h in content.hits) {
				arr.push(content.hits[h]);
			}
			$scope.productItems=arr;

			if (typePage==0) {
				if (total==0) {
					document.title="Không tìm thấy kết quả nào cho '"+keyword+"'";
				}
				else {
					document.title="Có "+total+" sản phẩm '"+keyword+"' mua online giá tốt";
				}
			}

			var categories=[];
			var categoriesContent=content.facets.subCategoryName;
			if (categoriesContent) {
				Object.keys(categoriesContent).forEach(function(key) {
					var value = categoriesContent[key];
					categories.push({
						"name":key,
						"count":value,
						"id":subCategoryValues[key]
					});
				});
			}
			$scope.subCategoryData=categories;


			var newBrands=[];
			var brandsContent=content.facets.brand;
			if (brandsContent) {
				Object.keys(brandsContent).forEach(function(key) {
					var value = brandsContent[key];
					newBrands.push({
						"name":key,
						"count":value
					});
				});
			}
			$scope.brandData=newBrands;


			var deliveries=[{
				"name":"Tất cả",
				"count":0,
				"id":0
			}];
			var deliveriesContent=content.facets.deliveryTime;
			if (deliveriesContent) {
				Object.keys(deliveriesContent).forEach(function(key) {
					var value = deliveriesContent[key];
					deliveries.push({
						"name":"Trong vòng "+key+" ngày",
						"count":value,
						"id":deliveryValues[key]
					});
				});
			}
			$scope.deliveryData=deliveries;


			var labels=[];
			if (typePage==0) {
				labels.push({
					"type":"keyword",
					"displayName":"Tên sản phẩm: "+keyword
				});
			}
			var filterCategories=$scope.filterData.subCategories;
			for (i = 0; i < filterCategories.length; i++) {
				labels.push({
					"type":"category",
					"displayName":subCategoryIds[filterCategories[i]],
					"data":filterCategories[i]
				});
			}
			var filterBrands=$scope.filterData.brands;
			for (i = 0; i < filterBrands.length; i++) {
				labels.push({
					"type":"brand",
					"displayName":filterBrands[i],
					"data":filterBrands[i]
				});
			}
			if ($scope.filterData.deliveryTime!=0) {
				labels.push({
					"type":"delivery",
					"displayName":"Trong vòng "+deliveryIds[$scope.filterData.deliveryTime]+" ngày"
				});
			}
			if ($scope.filterData.booked!=0) {
				labels.push({
					"type":"booked",
					"displayName":"Lượt mua > "+$scope.filterData.booked
				});
			}
			if ($scope.filterData.rangePriceFrom!=50 || $scope.filterData.rangePriceTo!=5000) {
				labels.push({
					"type":"price",
					"displayName":"Từ "+numberWithCommas($scope.filterData.rangePriceFrom)+".000đ đến "+numberWithCommas($scope.filterData.rangePriceTo)+".000đ"
				});
			}
			$scope.tagData=labels;
			$scope.$apply();


			var delay=""+(parseFloat(new Date().getTime()-start)/1000).toFixed(2)+" giây";
			if (labels.length==0) {
				customGA('ResultSearch', 'Search', 'NotFilter');
				if (total==0) {
					emptyFilter.css("display","block");
					filterPanel.css("display","none");
					emptyResult.css("display","block");
					productResult.css("display","none");
					pagingPanel.css("display","none");
					labelNumberResult.html("Không tìm thấy kết quả nào trong "+delay);
				}
				else {
					emptyFilter.css("display","none");
					filterPanel.css("display","block");
					emptyResult.css("display","none");
					productResult.css("display","block");
					pagingPanel.css("display","block");
					labelNumberResult.html("Có "+total+" kết quả tìm kiếm trong "+delay);
				}
				labelsTag.css("display","none");
			}
			else {
				customGA('ResultSearch', 'Search', 'Filter');
				labelsTag.css("display","block");
				if (total==0) {
					emptyFilter.css("display","block");
					filterPanel.css("display","none");
					emptyResult.css("display","block");
					productResult.css("display","none");
					pagingPanel.css("display","none");
					labelNumberResult.html("Không tìm thấy kết quả nào trong "+delay+" với điều kiện:");
				}
				else {
					emptyFilter.css("display","none");
					filterPanel.css("display","block");
					emptyResult.css("display","none");
					productResult.css("display","block");
					pagingPanel.css("display","block");
					labelNumberResult.html("Có "+total+" kết quả tìm kiếm trong "+delay+" với điều kiện:");
				}
			}
			loadingProduct.css("display","none");
			$rootScope.$broadcast('paging', {
				total:content.nbPages,
				current:content.page+1
			});
		}
		);
	};

	$scope.startNewSearch = function() {
		emptyFilter.css("display","none");
		filterPanel.css("display","none");
		loadingProduct.css("display","block");
		emptyResult.css("display","none");
		productResult.css("display","none");
		pagingPanel.css("display","none");
		$scope.filterData.page=0;
		$scope.performSearch();
	};

	$scope.remove = function(index) {
		var item=$scope.tagData[index];
		switch (item.type) {
			case 'keyword':
			showToast("error","Lỗi","Không thể xoá tên sản phẩm");
			break;
			case 'category':
			var indexCheck = $scope.filterData.subCategories.indexOf(item.data);
			if (indexCheck > -1) {
				$scope.filterData.subCategories.splice(indexCheck, 1);
			}
			break;
			case 'brand':
			var indexCheck = $scope.filterData.brands.indexOf(item.data);
			if (indexCheck > -1) {
				$scope.filterData.brands.splice(indexCheck, 1);
			}
			break;
			case 'delivery':
			$scope.filterData.deliveryTime=0;
			break;
			case 'booked':
			$scope.filterData.booked=0;
			orderBar.slider('setValue', 0);
			currentOrder=0;
			$("#display-order").html("Lớn hơn 0");
			break;
			case 'price':
			$scope.filterData.rangePriceFrom=50;
			$scope.filterData.rangePriceTo=5000;
			currentPriceFrom=50;
			currentPriceTo=5000;
			priceBar.slider('setValue', [50,5000]);
			$("#display-price").html("Từ 50.000<sup>đ</sup> đến 5.000.000<sup>đ</sup>");
			break;
		}

		if (item.type!='keyword') {
			emptyFilter.css("display","none");
			filterPanel.css("display","none");
			loadingProduct.css("display","block");
			emptyResult.css("display","none");
			productResult.css("display","none");
			pagingPanel.css("display","none");
			$scope.filterData.page=0;
			$scope.performSearch();
		}
	};


	$scope.startFilter = function() {
		emptyFilter.css("display","none");
		filterPanel.css("display","none");
		loadingProduct.css("display","block");
		emptyResult.css("display","none");
		productResult.css("display","none");
		pagingPanel.css("display","none");

		var categories=[];
		$(".categories-check-list").each(function(index) {
			if ($(this).is(":checked")) {
				categories.push(parseInt($(this).val()));
			}
		});

		if (categories.length!=0) {
			$scope.filterData.subCategories=categories;
		}

		var allBrands=[];
		$(".brand-check-list").each(function(index) {
			if ($(this).is(":checked")) {
				allBrands.push($(this).val());
			}
		});

		if (allBrands.length!=0) {
			$scope.filterData.brands=allBrands;
		}

		if ($scope.deliveryData.length>2) {
			$scope.filterData.deliveryTime= parseInt($('input[name=delivery-option]:checked').val());
		}

		$scope.filterData.booked= currentOrder;
		$scope.filterData.rangePriceFrom= currentPriceFrom;
		$scope.filterData.rangePriceTo=currentPriceTo;

		$scope.filterData.page=0;
		$scope.performSearch();
	};

	$scope.isFavoriteProduct = function(id) {
     	return isFavoriteProduct(id);
   	};

	$('#sort-option').on('change', function (e) {
    	$scope.startFilter();
	});


	$scope.$on('onPageChanged', function(event, args) {
		loadingProduct.css("display","block");
		productResult.css("display","none");
		customGA('ResultSearch', 'Paging', 'Click');

		$scope.filterData.page=args.page;
		$scope.performSearch();
    });


	$scope.startNewSearch();
});