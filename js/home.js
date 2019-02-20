var app = angular.module('SinglePage', ['angularLazyImg']);

app.controller('productController', function($scope,$http) {
  $http({
    method: 'GET',
    url: "https://data.doraeshop.vn/api/v1/lastest-product"+versionAsset.general.latestProduct+".json",
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    }})
  .then(function(response) {
    var categoriesData=response.data.data;
    for (i = 0; i < categoriesData.length; i++) { 
      switch(categoriesData[i].categoryId) {
        case 1:
        categoriesData[i].linkAll="me-va-be";
        categoriesData[i].icon="mom-category-icon";
        break;
        case 2:
        categoriesData[i].linkAll="suc-khoe-va-lam-dep";
        categoriesData[i].icon="beautiful-category-icon";
        break;
        case 3:
        categoriesData[i].linkAll="thoi-trang";
        categoriesData[i].icon="fashion-category-icon";
        break;
        case 4:
        categoriesData[i].linkAll="gia-dung";
        categoriesData[i].icon="furniture-category-icon";
        break;
        case 5:
        categoriesData[i].linkAll="dien-tu";
        categoriesData[i].icon="elec-category-icon";
        break;
        case 6:
        categoriesData[i].linkAll="the-thao";
        categoriesData[i].icon="sport-category-icon";
        break;
        case 7:
        categoriesData[i].linkAll="van-phong";
        categoriesData[i].icon="office-category-icon";
        break;
        case 8:
        categoriesData[i].linkAll="tong-hop";
        categoriesData[i].icon="goods-category-icon";
        break;
        default:break;
      }
    }
    $('#loading-home').remove();
    $scope.categoriesArr=categoriesData;

    $scope.formatPrice = function(num) {
     return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
   };

   $scope.isFavoriteProduct = function(id) {
     return isFavoriteProduct(id);
   };

   $scope.gaSend = function(id) {
     customGA('Home', 'CategoryClick', id.toString());
   };
 });
});