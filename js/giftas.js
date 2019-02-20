var app = angular.module('SinglePage', []);
var currentAngle=0;

function preventDefault(e) {
    e = e || window.event;
    if (e.preventDefault)
        e.preventDefault();
    e.returnValue = false;
}

function preventDefaultForScrollKeys(e) {
    if (e.keyCode>36 && e.keyCode<41) {
        preventDefault(e);
        return false;
    }
}

function handleScroll(enabled) {
    if (enabled) {
        if (window.removeEventListener)
            window.removeEventListener('DOMMouseScroll', preventDefault, false);
        window.onmousewheel = document.onmousewheel = null;
        window.onwheel = null;
        window.ontouchmove = null;
        document.onkeydown = null;
        $('body').css('overflow','visible');
    }
    else {
        if (window.addEventListener) // older FF
            window.addEventListener('DOMMouseScroll', preventDefault, false);
        window.onwheel = preventDefault; // modern standard
        window.onmousewheel = document.onmousewheel = preventDefault; // older browsers, IE
        window.ontouchmove  = preventDefault; // mobile
        document.onkeydown  = preventDefaultForScrollKeys;
        $('body').css('overflow','hidden');
    }
}

// AccountKit_OnInteractive = function(){
//     AccountKit.init(
//         {
//             appId:"1999638293635187",
//             version:"v1.0",
//             state:"gwegw222",
//             fbAppEventsEnabled:true
//         }
//     );
// };

var segments=[
    {'fillStyle' : '#ff834e', 'text' : '10.000 VNĐ'},
    {'fillStyle' : '#aaff3e', 'text' : '300.000 VNĐ'},
    {'fillStyle' : '#fcffb6', 'text' : '30.000 VNĐ'},
    {'fillStyle' : '#ff90a9', 'text' : '500.000 VNĐ'},
    {'fillStyle' : '#97a5ff', 'text' : '100.000 VNĐ'},
    {'fillStyle' : '#53fff6', 'text' : '50.000 VNĐ'},
    {'fillStyle' : '#b559ff', 'text' : '20.000 VNĐ'},
    {'fillStyle' : '#b1ff11', 'text' : '200.000 VNĐ'}
];

var theWheel = createWheel(Math.floor(Math.random() * 359));

function createWheel(oldAngle) {
    currentAngle=Math.floor(Math.random() * 44) + 1;
    return new Winwheel({
        'rotationAngle': oldAngle,
        'numSegments'  : 8,     // Specify number of segments.
        'outerRadius'  : 212,   // Set outer radius so wheel fits inside the background.
        'textFontSize' : 28,    // Set font size as desired.
        'segments'     : segments,        // Define segments including colour and text.
        'animation' :           // Specify the animation to use.
            {
                'stopAngle': currentAngle,
                'type'     : 'spinToStop',
                'duration' : 5,     // Duration in seconds.
                'spins'    : 8,     // Number of complete spins.
                'callbackFinished' : alertPrize,
                'callbackSound': segmentChanged
            }
    });
}

function segmentChanged() {
    $('#result-gift').text("Giải thưởng của bạn: "+segments[theWheel.getIndicatedSegmentNumber()-1].text);
}

var wheelSpinning = false;

function alertPrize(indicatedSegment) {
    wheelSpinning=false;
    $('#cancel-wheel').css('visibility',"visible");
    theWheel=createWheel(-currentAngle);
    var scope = angular.element(document.getElementById('gift-content-controller')).scope();
    scope.notifyRandomDone();
}

function startSpin() {
    if (!wheelSpinning)
    {
        $('#random-wheel').css('display',"none");
        $('#result-gift').css('display',"block");
        $('#cancel-wheel').css('visibility',"hidden");
        theWheel.animation.spins = 3;
        theWheel.startAnimation();
        wheelSpinning = true;
        var scope = angular.element(document.getElementById('gift-content-controller')).scope();
        scope.random();
    }
}

function reorder(list) {
    var left=list.filter(item => item.used===false).sort(function(a, b){return a.time > b.time });
    var right=list.filter(item => item.used===true).sort(function(a, b){return a.time > b.time });
    return left.concat(right);
}

function updateGiftList(data) {
    $('#main-gift-loading').css('display','none');
    if (data) {
        $('#phone-input-form').css('display','none');
        $('#grid-content').css('display','block');
        $('#phone-title').text(data.phoneNumber);
        if (data.orders.length==0) {
            $('#gift-list').css('display','none');
            $('#empty-order').css('display','block');
        }
        else {
            $('#gift-list').css('display','block');
            $('#empty-order').css('display','none');
            return reorder(data.orders);
        }
    }
    else {
        $('#phone-input-form').css('display','block');
        $('#grid-content').css('display','none');
        localStorage.removeItem("giftToken");
    }

    return [];
}

app.controller('historyController', function($scope,$http) {
    $scope.getProvider = function(provider) {
        switch (provider) {
            case 'viettel':return 'viettel';
            case 'mobi':return 'mobifone';
            case 'vina':return 'vinaphone';
            case 'gmo':return 'gmobile';
            default:return 'vnmobile';
        }
    };

    $scope.notifyRandomDone = function(phone,provider) {
        $scope.historyList.unshift({
            "phone": phone,
            "value": 10,
            "provider": provider
        });
    };

    $scope.historyList=[];
    $http({
        method: 'GET',
        url: "https://api.doraeshop.vn/v1/get-history-gift",
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        }
    })
        .then(function (response) {
            $('#history-gift').css('display','none');
            $('#history-content').css('display','block');
            $scope.historyList=response.data.data;
        });
});

app.controller('giftController', function($scope,$http) {
    $scope.reload = function() {
        var token=localStorage.giftToken;
        if (token) {
            $('#main-gift-loading').css('display','block');
            $('#phone-input-form').css('display','none');
            $('#grid-content').css('display','none');
            $http({
                method: 'GET',
                url: "https://api.doraeshop.vn/v1/gift-of-phone",
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': token
                }
            })
                .then(function (response) {
                    $scope.orders=updateGiftList(response.data.data);
                }, function (err) {
                    updateGiftList(null);
                });
        }
        else {
            updateGiftList(null);
        }
    };

    $scope.logout = function() {
        updateGiftList(null);
        $http({
            method: 'POST',
            url: "https://api.doraeshop.vn/v1/use-other-phone",
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': localStorage.giftToken
            }
        })
            .then(function (response) {

            }, function (err) {

            });
    };

    $scope.notifyRandomDone = function() {
        var id=$("#key-detail").text();
        var orders=$scope.orders;
        for (i=0;i<orders.length;i++) {
            var order=orders[i];
            if (order.id===id) {
                order.used=true;
                $scope.orders=reorder(orders);
                $scope.$apply();
                break;
            }
        }
    };

    $scope.random = function() {
        $http({
            method: 'POST',
            url: "https://api.doraeshop.vn/v1/use-gift/"+$("#key-detail").text(),
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Authorization': localStorage.giftToken
            }
        })
            .then(function (response) {
                if (response.data.code!==200) {
                    closeGift();
                    showToast("error","Lỗi","Lỗi chưa xác định");
                }
                else {
                    var data=response.data.data;
                    var scope = angular.element(document.getElementById('right-content')).scope();
                    scope.notifyRandomDone(data.phone,data.provider);
                }
            }, function (err) {
                closeGift();
                updateGiftList(null);
                showToast("error","Lỗi","Xác thực thất bại");
            });
    };

    $scope.openDetail = function(id,used) {
        if (!used) {
            $("#wheel-content").css('display','block');
            handleScroll(false);
            $("#key-detail").text(id);
            $("#random-wheel").css('display','block');
            $("#result-gift").css('display','none');
        }
    };

    $scope.verifyPhone = function() {
        try {
            AccountKit.init(
                {
                    appId:"1999638293635187",
                    version:"v1.0",
                    state:"gwegw222",
                    fbAppEventsEnabled:true
                }
            );
        }
        catch(err) {

        }

        var phone=$('#phone-input').val();
        if (phone) {
            if (AccountKit) {
                AccountKit.login(
                    'PHONE',
                    { countryCode: "+84", phoneNumber: phone },
                    function (response) {
                        if (response.status === "PARTIALLY_AUTHENTICATED") {
                            $('#main-gift-loading').css('display','block');
                            $('#phone-input-form').css('display','none');
                            $('#grid-content').css('display','none');
                            $http({
                                method: 'POST',
                                url: "https://api.doraeshop.vn/v1/phone-authenticate",
                                data: {
                                    code: response.code
                                },
                                headers: {
                                    'Content-Type': 'text/plain; charset=utf-8'
                                }
                            })
                                .then(function (response) {
                                    if (response.data.code==200) {
                                        localStorage.giftToken=response.data.data.token;
                                        $scope.orders=updateGiftList(response.data.data.gift);
                                    }
                                    else {
                                        showToast("error","Lỗi","Xác thực thất bại");
                                    }
                                });
                        }
                    }
                );
            }
            else {
                showToast("error","Lỗi","Vui lòng tải lại trang web này hoặc bấm F5");
            }
        }
        else {
            showToast("error","Lỗi","Vui lòng điền số điện thoại của bạn");
        }
    };

    $scope.reload();
});

function closeGift() {
    handleScroll(true);
    $("#wheel-content").css('display','none');
}

function eventGift(ev)
{
    if (ev.originalEvent.key=='giftToken') {
        var scope = angular.element(document.getElementById('gift-content-controller')).scope();
        scope.reload();
    }
}

$(window).on('storage', eventGift);