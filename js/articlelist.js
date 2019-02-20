var perPage=8;

function timeSince(date) {
	var seconds = Math.floor((new Date() - date) / 1000);
	var interval = Math.floor(seconds / 31536000);

	if (interval >= 1) {
		return interval + " năm trước";
	}

	interval = Math.floor(seconds / 2592000);
	if (interval >= 1) {
		return interval + " tháng trước";
	}
	interval = Math.floor(seconds / 86400);
	if (interval >= 1) {
		return interval + " ngày trước";
	}
	interval = Math.floor(seconds / 3600);
	if (interval >= 1) {
		return interval + " giờ trước";
	}
	interval = Math.floor(seconds / 60);
	if (interval >= 1) {
		return interval + " phút trước";
	}
	return Math.floor(seconds) + " giây trước";
}

var app = angular.module('SinglePage', []);

app.controller('articleController', function($scope,$http,$rootScope) {
	$scope.generateLdJson = function(articles) {
		var result={
  			"@context": "http://schema.org",
  			"@type": "ItemList",
  			"itemListElement": []
		};
		var size=Math.min(articles.length,3);

		for (i = 0; i < size; i++) {
			var time=new Date();
			time.setTime(articles[i].time);
			result.itemListElement.push({
      			"@type": "ListItem",
      			"position": (i+1).toString(),
      			"item": {
        			"@type": "Article",
        			"headline":articles[i].title,
        			"image": [articles[i].img],
        			"description":articles[i].shortDescription,
        			"datePublished":time.toISOString(),
        			"dateModified":time.toISOString(),
        			"aggregateRating": {
         				"@type": "AggregateRating",
          				"ratingValue": "5",
          				"reviewCount": "52",
          				"bestRating": "5",
    					"worstRating": "1"
        			},
        			"author":"DoraeShop",
        			"publisher": {
    					"@type": "Organization",
    					"name": "DoraeShop",
    					"logo": {
      						"@type": "ImageObject",
      						"url": "https://asset.doraeshop.vn/img/logo_square.jpg"
    					}
    				},
        			"url":window.location.origin+"/bai-viet/"+articles[i].url
        		}
			});
		}

		return JSON.stringify(result);
	};

	$scope.load = function(currentPage) {
		$("#loading-articles").css("display","block");
		$("#main-articles").css("display","none");
		$http({
			method: 'GET',
			url: "https://api.doraeshop.vn/v1/get-article-list?perPage="+perPage+"&page="+currentPage,
			headers: {
				'Content-Type': 'application/json; charset=utf-8'
			}})
		.then(function(response) {
			if (response.data.code==200) {
				var data=response.data.data;
				$scope.listArticle=data.articles;
				$rootScope.$broadcast('paging', {
					total:Math.floor(data.total/perPage)+(data.total%perPage==0? 0:1),
					current:currentPage
				});
				$("#loading-articles").css("display","none");
				$("#main-articles").css("display","block");
				$("#articles-pagination").css("display","block");
				var el = document.createElement('script');
   				el.type = 'application/ld+json';
   				el.text= $scope.generateLdJson(data.articles);
   				document.querySelector('head').appendChild(el);
			}
		});
	};

	$scope.$on('onPageChanged', function(event, args) {
		$scope.load(args.page+1);
	});

	$scope.gaSend = function() {
     	customGA('ArticleList', 'ArticleClick', 'Latest');
   	};

	$scope.timeSince = function(time) {
		var date=new Date();
		date.setTime(time);
		return timeSince(date);
	};

	$scope.load(1);
});

app.controller('rankController', function($scope,$http) {
	$http({
		method: 'GET',
		url: "https://api.doraeshop.vn/v1/top-rank-articles",
		headers: {
			'Content-Type': 'application/json; charset=utf-8'
		}})
	.then(function(response) {
		$scope.rankList=response.data.data;
		$("#loading-top").remove();
		$("#rank-list").css("display","block");
	});

	$scope.gaSend = function(index) {
		var source='';
		switch (index) {
			case 0:
			source='TopView';
			break;
			case 1:
			source='TopComment';
			break;
			case 2:
			source='TopShare';
			break;
		}
     	customGA('ArticleList', 'ArticleClick', source);
   	};
});