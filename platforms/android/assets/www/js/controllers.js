var global_login_id = "";
var contact_detail_data = [];

angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicModal, $timeout) {

	// With the new view caching in Ionic, Controllers are only called
	// when they are recreated or on app start, instead of every page change.
	// To listen for when this page is active (for example, to refresh data),
	// listen for the $ionicView.enter event:
	//$scope.$on('$ionicView.enter', function(e) {
	//});
	
	// Form data for the login modal
	$scope.loginData = {};
	
	// Create the login modal that we will use later
	$ionicModal.fromTemplateUrl('templates/login.html', {
		scope: $scope
		}).then(function(modal) {
		$scope.modal = modal;
	});
	
	// Triggered in the login modal to close it
	$scope.closeLogin = function() {
		$scope.modal.hide();
	};
	
	// Open the login modal
	$scope.login = function() {
		$scope.modal.show();
	};
	
	// Perform the login action when the user submits the login form
	$scope.doLogin = function() {
	console.log('Doing login', $scope.loginData);
	
	// Simulate a login delay. Remove this and replace with your login
	// code if using a login system
	$timeout(function() {
	  	$scope.closeLogin();
		}, 1000);
	};
})


.controller('LogoutCtrl', function($scope,$rootScope,$ionicHistory) {
	$scope.login = "";
	
	$rootScope.$on('login_var', function (event, args) {
		$scope.login = args.global_login;
		global_login_id = args.global_login;
	});
	
	$scope.logout = function(){
		$ionicHistory.clearCache();
		login_var = "";
		$rootScope.$broadcast('login_var',{global_login:login_var});
	}
})



.controller('dashboardCtrl', function($scope,$state,$cordovaContacts,$timeout,$ionicLoading,$cordovaSms,$ionicHistory,$http,$ionicScrollDelegate,$ionicPopup,$rootScope) {
	
	$ionicLoading.show({template: '<ion-spinner icon="crescent"></ion-spinner><p>Please wait it will take few minutes for synchronizing contacts.</p>'});
	//$timeout( function(){ $scope.getContactList(); },1500);
	$scope.phoneContacts = [];
	
	$scope.getContactList_from_server = function() {
		var action = "get_store_contacts";
		//var  global_login_id ="27";
		var data_parameters = "action="+action+"&user_id="+global_login_id;
		$http.post(globalurl,data_parameters, {
			headers: {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}
		})
		.success(function(response) {
			if(response[0].status == "Y"){
				$scope.phoneContacts = response;
				$ionicLoading.hide(); // loading hide
			}
			else{
				$scope.getContactList();
			}
		});
	};
	
	
	$scope.getContactList = function() {
		function onSuccess(contacts) {
			for (var i = 0; i < contacts.length; i++) {
				var displayname = 	contacts[i].displayName;
				var contact = contacts[i].phoneNumbers;
					if (contact != null){
						for(j=0; j< contact.length; j++){
							// only include phone number of mobile not any other like watsapp
							if(contact[j].type == "mobile"){
						 		contact_detail_data.push({name:displayname,number:contact[j].value});
								break; // do break if mobile come for two times
							}
						}
					}
			}
			
			var contact_data = JSON.stringify(contact_detail_data);
		
			var action = "store_contacts";
			var data_parameters = "action="+action+"&user_id="+global_login_id+ "&contact_data="+contact_data;
			$http.post(globalurl,data_parameters, {
				headers: {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}
			})
			.success(function(response) {
				$scope.getContactList_from_server();
			});
		};
			
		function onError(contactError) {
			alert(contactError);
		};
		
		
		var options = {};
		options.multiple = true;
		options.hasPhoneNumber = true;
		$cordovaContacts.find(options).then(onSuccess, onError);
	};
	
	
	$scope.sendsms = function(number) {
		var content = "Hello Welcome to contact book";
		//for sending direct message to number
		//SMS.sendSMS(number, content, function(){}, function(str){alert(str);});
		
		//sending via android phone message box
		window.open ("sms:"+number+"?body=" + "hello","_system");
	};
	
	$scope.docall = function(number) {
		window.open('tel:'+number,'_system');
	};
	
	// change scroll position to top while searching
	$scope.scrollTop = function() {
        $ionicScrollDelegate.resize();  
    };
	
	//delete contact number
	$scope.delete_contact = function(msgid,contact_name) {
		
		var confirmPopup = $ionicPopup.confirm({
         	title: 'Are you sure to delete '+contact_name+'?'
      	});

		confirmPopup.then(function(res) {
			if(res) {
				$ionicLoading.show({template: '<ion-spinner icon="crescent"></ion-spinner>'});
				var action = "delete_contact";
				var data_parameters = "action="+action+"&msg_id="+msgid;
				$http.post(globalurl,data_parameters, {
					headers: {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}
				})
				.success(function(response) {
					if(response[0].status == "Y"){
						$scope.getContactList_from_server();
					}
					else{
						//$scope.getContactList();
					}
				});
			} else {
				//console.log('Not sure!');
			}
		});
		
	};
	
	//edit_contact contact number
	$scope.edit_contact = function(msgid,contact_name,contact_number) {
		$state.go('app.edit_contact', { 'msgid': msgid, 'contact_name': contact_name, 'contact_number': contact_number });
	};
	
	$scope.getContactList_from_server(); // function calling
	
	$rootScope.$on("CallParentMethod_get_contact_list", function(){
	   $scope.getContactList_from_server();
	});
})


.controller('edit_contact', function($scope,$state,$http,$stateParams,$ionicPopup,$ionicLoading,$rootScope) {
	$scope.user = {name : $stateParams.contact_name,number : $stateParams.contact_number};
	
	//update contact details
	$scope.update_contact = function(user) {
		var name = user.name;
		var number = user.number;
		
		
		if(typeof name === "undefined" || typeof number === "undefined" || name == "" || number == ""){
			$ionicPopup.show({
			  template: '',
			  title: 'Please fill all fields',
			  scope: $scope,
			  buttons: [
				{ 
				  text: 'Ok',
				  type: 'button-assertive'
				},
			  ]
			})
		}else{
			$ionicLoading.show({template: '<ion-spinner icon="crescent"></ion-spinner>'});
			var action = "edit_contact";
			var data_parameters = "action="+action+"&msg_id="+$stateParams.msgid+"&name="+name+"&number="+number;
			$http.post(globalurl,data_parameters, {
				headers: {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}
			})
			.success(function(response) {
				if(response[0].status == "Y"){
					$ionicLoading.hide(); // loading hide
					$rootScope.$emit("CallParentMethod_get_contact_list", {});
					$ionicPopup.show({
					  template: '',
					  title: 'Contact updated successfully.',
					  scope: $scope,
					  buttons: [
						{
						  text: 'Ok',
						  type: 'button-assertive'
						},
					  ]
					})
				}
				else{
					//$scope.getContactList();
				}
			});
		}
	};
	
})



.controller('contactCtrl', function($scope) {
	$scope.mapCreated = function(map) {
		$scope.map = map;
	};
	
	$scope.centerOnMe = function () {
		console.log("Centering");
		if (!$scope.map) {
		  return;
		}
	
		$scope.loading = $ionicLoading.show({
		  content: 'Getting current location...',
		  showBackdrop: false
		});
	
		navigator.geolocation.getCurrentPosition(function (pos) {
		  console.log('Got pos', pos);
		  $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
		  $scope.loading.hide();
		}, function (error) {
		  alert('Unable to get location: ' + error.message);
		});
	};
})

.controller('emailCtrl', function($scope,$state,$http,$ionicPopup) {
	$scope.user = {
			name : '',
			email : '',
			website : '',
			comments : ''
	};
	
	$scope.sendemail = function(user){
		var name = user.name;
		var email = user.email;
		var website = user.website;
		var comments = user.comments;
		
		var data_parameters = "cont_name="+name+ "&cont_mail="+email+ "&cont_url="+website+ "&cont_message="+comments;
		$http.post("http://"+globalip+"/email.php",data_parameters, {
			headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
		})
		.success(function(response){
			if(response[0].status == "Y"){
				$ionicPopup.show({
				  template: '',
				  title: 'Email sent successfully.',
				  scope: $scope,
				  buttons: [
					{
					  text: 'Ok',
					  type: 'button-assertive'
					},
				  ]
				})
			}
		});
	}
})


// Authentication controller
// Put your login, register functions here
.controller('AuthCtrl', function($scope,$ionicHistory,$rootScope,$http,$ionicPopup,$state) {
	var country_name = "";
	var country_dial_code = "";
	
	$scope.user = {username: '',password : ''};
    // hide back butotn in next view
	$ionicHistory.nextViewOptions({
      	disableBack: true
    });
	
	
	// country data array
	var countries = [{"name":"Afghanistan","dial_code":"+93","code":"AF"},{"name":"Albania","dial_code":"+355","code":"AL"},{"name":"Algeria","dial_code":"+213","code":"DZ"},{"name":"AmericanSamoa","dial_code":"+1 684","code":"AS"},{"name":"Andorra","dial_code":"+376","code":"AD"},{"name":"Angola","dial_code":"+244","code":"AO"},{"name":"Anguilla","dial_code":"+1 264","code":"AI"},{"name":"Antarctica","dial_code":"+672","code":"AQ"},{"name":"Antigua and Barbuda","dial_code":"+1268","code":"AG"},{"name":"Argentina","dial_code":"+54","code":"AR"},{"name":"Armenia","dial_code":"+374","code":"AM"},{"name":"Aruba","dial_code":"+297","code":"AW"},{"name":"Australia","dial_code":"+61","code":"AU"},{"name":"Austria","dial_code":"+43","code":"AT"},{"name":"Azerbaijan","dial_code":"+994","code":"AZ"},{"name":"Bahamas","dial_code":"+1 242","code":"BS"},{"name":"Bahrain","dial_code":"+973","code":"BH"},{"name":"Bangladesh","dial_code":"+880","code":"BD"},{"name":"Barbados","dial_code":"+1 246","code":"BB"},{"name":"Belarus","dial_code":"+375","code":"BY"},{"name":"Belgium","dial_code":"+32","code":"BE"},{"name":"Belize","dial_code":"+501","code":"BZ"},{"name":"Benin","dial_code":"+229","code":"BJ"},{"name":"Bermuda","dial_code":"+1 441","code":"BM"},{"name":"Bhutan","dial_code":"+975","code":"BT"},{"name":"Bolivia, Plurinational State of","dial_code":"+591","code":"BO"},{"name":"Bosnia and Herzegovina","dial_code":"+387","code":"BA"},{"name":"Botswana","dial_code":"+267","code":"BW"},{"name":"Brazil","dial_code":"+55","code":"BR"},{"name":"British Indian Ocean Territory","dial_code":"+246","code":"IO"},{"name":"Brunei Darussalam","dial_code":"+673","code":"BN"},{"name":"Bulgaria","dial_code":"+359","code":"BG"},{"name":"Burkina Faso","dial_code":"+226","code":"BF"},{"name":"Burundi","dial_code":"+257","code":"BI"},{"name":"Cambodia","dial_code":"+855","code":"KH"},{"name":"Cameroon","dial_code":"+237","code":"CM"},{"name":"Canada","dial_code":"+1","code":"CA"},{"name":"Cape Verde","dial_code":"+238","code":"CV"},{"name":"Cayman Islands","dial_code":"+ 345","code":"KY"},{"name":"Central African Republic","dial_code":"+236","code":"CF"},{"name":"Chad","dial_code":"+235","code":"TD"},{"name":"Chile","dial_code":"+56","code":"CL"},{"name":"China","dial_code":"+86","code":"CN"},{"name":"Christmas Island","dial_code":"+61","code":"CX"},{"name":"Cocos (Keeling) Islands","dial_code":"+61","code":"CC"},{"name":"Colombia","dial_code":"+57","code":"CO"},{"name":"Comoros","dial_code":"+269","code":"KM"},{"name":"Congo","dial_code":"+242","code":"CG"},{"name":"Congo, The Democratic Republic of the","dial_code":"+243","code":"CD"},{"name":"Cook Islands","dial_code":"+682","code":"CK"},{"name":"Costa Rica","dial_code":"+506","code":"CR"},{"name":"Cote d'Ivoire","dial_code":"+225","code":"CI"},{"name":"Croatia","dial_code":"+385","code":"HR"},{"name":"Cuba","dial_code":"+53","code":"CU"},{"name":"Cyprus","dial_code":"+357","code":"CY"},{"name":"Czech Republic","dial_code":"+420","code":"CZ"},{"name":"Denmark","dial_code":"+45","code":"DK"},{"name":"Djibouti","dial_code":"+253","code":"DJ"},{"name":"Dominica","dial_code":"+1 767","code":"DM"},{"name":"Dominican Republic","dial_code":"+1 849","code":"DO"},{"name":"Ecuador","dial_code":"+593","code":"EC"},{"name":"Egypt","dial_code":"+20","code":"EG"},{"name":"El Salvador","dial_code":"+503","code":"SV"},{"name":"Equatorial Guinea","dial_code":"+240","code":"GQ"},{"name":"Eritrea","dial_code":"+291","code":"ER"},{"name":"Estonia","dial_code":"+372","code":"EE"},{"name":"Ethiopia","dial_code":"+251","code":"ET"},{"name":"Falkland Islands (Malvinas)","dial_code":"+500","code":"FK"},{"name":"Faroe Islands","dial_code":"+298","code":"FO"},{"name":"Fiji","dial_code":"+679","code":"FJ"},{"name":"Finland","dial_code":"+358","code":"FI"},{"name":"France","dial_code":"+33","code":"FR"},{"name":"French Guiana","dial_code":"+594","code":"GF"},{"name":"French Polynesia","dial_code":"+689","code":"PF"},{"name":"Gabon","dial_code":"+241","code":"GA"},{"name":"Gambia","dial_code":"+220","code":"GM"},{"name":"Georgia","dial_code":"+995","code":"GE"},{"name":"Germany","dial_code":"+49","code":"DE"},{"name":"Ghana","dial_code":"+233","code":"GH"},{"name":"Gibraltar","dial_code":"+350","code":"GI"},{"name":"Greece","dial_code":"+30","code":"GR"},{"name":"Greenland","dial_code":"+299","code":"GL"},{"name":"Grenada","dial_code":"+1 473","code":"GD"},{"name":"Guadeloupe","dial_code":"+590","code":"GP"},{"name":"Guam","dial_code":"+1 671","code":"GU"},{"name":"Guatemala","dial_code":"+502","code":"GT"},{"name":"Guernsey","dial_code":"+44","code":"GG"},{"name":"Guinea","dial_code":"+224","code":"GN"},{"name":"Guinea-Bissau","dial_code":"+245","code":"GW"},{"name":"Guyana","dial_code":"+595","code":"GY"},{"name":"Haiti","dial_code":"+509","code":"HT"},{"name":"Holy See (Vatican City State)","dial_code":"+379","code":"VA"},{"name":"Honduras","dial_code":"+504","code":"HN"},{"name":"Hong Kong","dial_code":"+852","code":"HK"},{"name":"Hungary","dial_code":"+36","code":"HU"},{"name":"Iceland","dial_code":"+354","code":"IS"},{"name":"India","dial_code":"+91","code":"IN"},{"name":"Indonesia","dial_code":"+62","code":"ID"},{"name":"Iran, Islamic Republic of","dial_code":"+98","code":"IR"},{"name":"Iraq","dial_code":"+964","code":"IQ"},{"name":"Ireland","dial_code":"+353","code":"IE"},{"name":"Isle of Man","dial_code":"+44","code":"IM"},{"name":"Israel","dial_code":"+972","code":"IL"},{"name":"Italy","dial_code":"+39","code":"IT"},{"name":"Jamaica","dial_code":"+1 876","code":"JM"},{"name":"Japan","dial_code":"+81","code":"JP"},{"name":"Jersey","dial_code":"+44","code":"JE"},{"name":"Jordan","dial_code":"+962","code":"JO"},{"name":"Kazakhstan","dial_code":"+7 7","code":"KZ"},{"name":"Kenya","dial_code":"+254","code":"KE"},{"name":"Kiribati","dial_code":"+686","code":"KI"},{"name":"Korea, Democratic People's Republic of","dial_code":"+850","code":"KP"},{"name":"Korea, Republic of","dial_code":"+82","code":"KR"},{"name":"Kuwait","dial_code":"+965","code":"KW"},{"name":"Kyrgyzstan","dial_code":"+996","code":"KG"},{"name":"Lao People's Democratic Republic","dial_code":"+856","code":"LA"},{"name":"Latvia","dial_code":"+371","code":"LV"},{"name":"Lebanon","dial_code":"+961","code":"LB"},{"name":"Lesotho","dial_code":"+266","code":"LS"},{"name":"Liberia","dial_code":"+231","code":"LR"},{"name":"Libyan Arab Jamahiriya","dial_code":"+218","code":"LY"},{"name":"Liechtenstein","dial_code":"+423","code":"LI"},{"name":"Lithuania","dial_code":"+370","code":"LT"},{"name":"Luxembourg","dial_code":"+352","code":"LU"},{"name":"Macao","dial_code":"+853","code":"MO"},{"name":"Macedonia, The Former Yugoslav Republic of","dial_code":"+389","code":"MK"},{"name":"Madagascar","dial_code":"+261","code":"MG"},{"name":"Malawi","dial_code":"+265","code":"MW"},{"name":"Malaysia","dial_code":"+60","code":"MY"},{"name":"Maldives","dial_code":"+960","code":"MV"},{"name":"Mali","dial_code":"+223","code":"ML"},{"name":"Malta","dial_code":"+356","code":"MT"},{"name":"Marshall Islands","dial_code":"+692","code":"MH"},{"name":"Martinique","dial_code":"+596","code":"MQ"},{"name":"Mauritania","dial_code":"+222","code":"MR"},{"name":"Mauritius","dial_code":"+230","code":"MU"},{"name":"Mayotte","dial_code":"+262","code":"YT"},{"name":"Mexico","dial_code":"+52","code":"MX"},{"name":"Micronesia, Federated States of","dial_code":"+691","code":"FM"},{"name":"Moldova, Republic of","dial_code":"+373","code":"MD"},{"name":"Monaco","dial_code":"+377","code":"MC"},{"name":"Mongolia","dial_code":"+976","code":"MN"},{"name":"Montenegro","dial_code":"+382","code":"ME"},{"name":"Montserrat","dial_code":"+1664","code":"MS"},{"name":"Morocco","dial_code":"+212","code":"MA"},{"name":"Mozambique","dial_code":"+258","code":"MZ"},{"name":"Myanmar","dial_code":"+95","code":"MM"},{"name":"Namibia","dial_code":"+264","code":"NA"},{"name":"Nauru","dial_code":"+674","code":"NR"},{"name":"Nepal","dial_code":"+977","code":"NP"},{"name":"Netherlands","dial_code":"+31","code":"NL"},{"name":"Netherlands Antilles","dial_code":"+599","code":"AN"},{"name":"New Caledonia","dial_code":"+687","code":"NC"},{"name":"New Zealand","dial_code":"+64","code":"NZ"},{"name":"Nicaragua","dial_code":"+505","code":"NI"},{"name":"Niger","dial_code":"+227","code":"NE"},{"name":"Nigeria","dial_code":"+234","code":"NG"},{"name":"Niue","dial_code":"+683","code":"NU"},{"name":"Norfolk Island","dial_code":"+672","code":"NF"},{"name":"Northern Mariana Islands","dial_code":"+1 670","code":"MP"},{"name":"Norway","dial_code":"+47","code":"NO"},{"name":"Oman","dial_code":"+968","code":"OM"},{"name":"Pakistan","dial_code":"+92","code":"PK"},{"name":"Palau","dial_code":"+680","code":"PW"},{"name":"Palestinian Territory, Occupied","dial_code":"+970","code":"PS"},{"name":"Panama","dial_code":"+507","code":"PA"},{"name":"Papua New Guinea","dial_code":"+675","code":"PG"},{"name":"Paraguay","dial_code":"+595","code":"PY"},{"name":"Peru","dial_code":"+51","code":"PE"},{"name":"Philippines","dial_code":"+63","code":"PH"},{"name":"Pitcairn","dial_code":"+872","code":"PN"},{"name":"Poland","dial_code":"+48","code":"PL"},{"name":"Portugal","dial_code":"+351","code":"PT"},{"name":"Puerto Rico","dial_code":"+1 939","code":"PR"},{"name":"Qatar","dial_code":"+974","code":"QA"},{"name":"Romania","dial_code":"+40","code":"RO"},{"name":"Russia","dial_code":"+7","code":"RU"},{"name":"Rwanda","dial_code":"+250","code":"RW"},{"name":"Réunion","dial_code":"+262","code":"RE"},{"name":"Saint Barthélemy","dial_code":"+590","code":"BL"},{"name":"Saint Helena, Ascension and Tristan Da Cunha","dial_code":"+290","code":"SH"},{"name":"Saint Kitts and Nevis","dial_code":"+1 869","code":"KN"},{"name":"Saint Lucia","dial_code":"+1 758","code":"LC"},{"name":"Saint Martin","dial_code":"+590","code":"MF"},{"name":"Saint Pierre and Miquelon","dial_code":"+508","code":"PM"},{"name":"Saint Vincent and the Grenadines","dial_code":"+1 784","code":"VC"},{"name":"Samoa","dial_code":"+685","code":"WS"},{"name":"San Marino","dial_code":"+378","code":"SM"},{"name":"Sao Tome and Principe","dial_code":"+239","code":"ST"},{"name":"Saudi Arabia","dial_code":"+966","code":"SA"},{"name":"Senegal","dial_code":"+221","code":"SN"},{"name":"Serbia","dial_code":"+381","code":"RS"},{"name":"Seychelles","dial_code":"+248","code":"SC"},{"name":"Sierra Leone","dial_code":"+232","code":"SL"},{"name":"Singapore","dial_code":"+65","code":"SG"},{"name":"Slovakia","dial_code":"+421","code":"SK"},{"name":"Slovenia","dial_code":"+386","code":"SI"},{"name":"Solomon Islands","dial_code":"+677","code":"SB"},{"name":"Somalia","dial_code":"+252","code":"SO"},{"name":"South Africa","dial_code":"+27","code":"ZA"},{"name":"South Georgia and the South Sandwich Islands","dial_code":"+500","code":"GS"},{"name":"Spain","dial_code":"+34","code":"ES"},{"name":"Sri Lanka","dial_code":"+94","code":"LK"},{"name":"Sudan","dial_code":"+249","code":"SD"},{"name":"Suriname","dial_code":"+597","code":"SR"},{"name":"Svalbard and Jan Mayen","dial_code":"+47","code":"SJ"},{"name":"Swaziland","dial_code":"+268","code":"SZ"},{"name":"Sweden","dial_code":"+46","code":"SE"},{"name":"Switzerland","dial_code":"+41","code":"CH"},{"name":"Syrian Arab Republic","dial_code":"+963","code":"SY"},{"name":"Taiwan, Province of China","dial_code":"+886","code":"TW"},{"name":"Tajikistan","dial_code":"+992","code":"TJ"},{"name":"Tanzania, United Republic of","dial_code":"+255","code":"TZ"},{"name":"Thailand","dial_code":"+66","code":"TH"},{"name":"Timor-Leste","dial_code":"+670","code":"TL"},{"name":"Togo","dial_code":"+228","code":"TG"},{"name":"Tokelau","dial_code":"+690","code":"TK"},{"name":"Tonga","dial_code":"+676","code":"TO"},{"name":"Trinidad and Tobago","dial_code":"+1 868","code":"TT"},{"name":"Tunisia","dial_code":"+216","code":"TN"},{"name":"Turkey","dial_code":"+90","code":"TR"},{"name":"Turkmenistan","dial_code":"+993","code":"TM"},{"name":"Turks and Caicos Islands","dial_code":"+1 649","code":"TC"},{"name":"Tuvalu","dial_code":"+688","code":"TV"},{"name":"Uganda","dial_code":"+256","code":"UG"},{"name":"Ukraine","dial_code":"+380","code":"UA"},{"name":"United Arab Emirates","dial_code":"+971","code":"AE"},{"name":"United Kingdom","dial_code":"+44","code":"GB"},{"name":"United States","dial_code":"+1","code":"US"},{"name":"Uruguay","dial_code":"+598","code":"UY"},{"name":"Uzbekistan","dial_code":"+998","code":"UZ"},{"name":"Vanuatu","dial_code":"+678","code":"VU"},{"name":"Venezuela, Bolivarian Republic of","dial_code":"+58","code":"VE"},{"name":"Viet Nam","dial_code":"+84","code":"VN"},{"name":"Virgin Islands, British","dial_code":"+1 284","code":"VG"},{"name":"Virgin Islands, U.S.","dial_code":"+1 340","code":"VI"},{"name":"Wallis and Futuna","dial_code":"+681","code":"WF"},{"name":"Yemen","dial_code":"+967","code":"YE"},{"name":"Zambia","dial_code":"+260","code":"ZM"},{"name":"Zimbabwe","dial_code":"+263","code":"ZW"},{"name":"Åland Islands","dial_code":"+358","code":"AX"}];

	
	$scope.country_names = countries;
	
	$scope.getdialcode = function(value) {
		var datasplit = value.split(",");
		$scope.user = {register_dial_code: datasplit[0],login_dial_code: datasplit[0],register_country: datasplit[1],s_country_name:datasplit[1]};
	};
	
	// get lat,long,country name and phone code
	navigator.geolocation.getCurrentPosition(function (pos) {
		 var lat = pos.coords.latitude;
		 var long = pos.coords.longitude;
		 var geocoder = new google.maps.Geocoder();
		 var latlng = new google.maps.LatLng(lat, long);

			geocoder.geocode({ 'latLng': latlng }, function (results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					if (results[1]) {
						// get country name using loop
						for(var j=0;j < results[1].address_components.length;j++){
							var cn = results[1].address_components[j].types[0];
							if(cn == "country")
							{
								 country_name = results[1].address_components[j].long_name;
								 break;
							}
							
						}
						
						for (var i = 0; i < countries.length; i++) {
							if(country_name == countries[i].name){
								country_dial_code = countries[i].dial_code;
								break;
							}
                		}
						// automatic set country and country code according to the location
						$scope.user = {register_dial_code : country_dial_code,login_dial_code: country_dial_code,register_country: country_name,login_country:country_name,s_country_name:country_name};
						
					} else {
						console.log('Location not found');
					}
				} else {
					console.log('Geocoder failed due to: ' + status);
				}
			})
	}, function (error) {
		  alert('Unable to get location: ' + error.message);
	});
	
	
	
	// below code is for accordian
	$scope.toggleGroup = function(group) {
		if ($scope.isGroupShown(group)) {
		  $scope.shownGroup = null;
		} else {
		  $scope.shownGroup = group;
		}
	};
	$scope.isGroupShown = function(group) {
		return $scope.shownGroup === group;
	};
	
	
	$scope.shownGroup1 = null;
	
	$scope.toggleGroup1 = function(group1) {
		if ($scope.isGroupShown1(group1)) {
		  $scope.shownGroup1 = null;
		} else {
		  $scope.shownGroup1 = group1;
		}
	};
	$scope.isGroupShown1 = function(group1) {
		return $scope.shownGroup1 === group1;
	};
	// above code is for accordian
	
	
   	$scope.signIn = function(user) {
		var username = user.username;
		var password = user.password;
		
		
		if(typeof username === "undefined" || typeof password === "undefined" || username == "" || password == ""){
			$ionicPopup.show({
			  template: '',
			  title: 'Please fill all fields',
			  scope: $scope,
			  buttons: [
				{ 
				  text: 'Ok',
				  type: 'button-assertive'
				},
			  ]
			})
		}
		else{
			var action = "login";
			var data_parameters = "action="+action+"&username="+username+ "&password="+password;
			$http.post(globalurl,data_parameters, {
				headers: {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}
			})
			.success(function(response) {
				if(response[0].status == "Y"){
					$rootScope.$broadcast('login_var',{global_login:response[0].userid});
					$state.go('app.dashboard');
				}
				else{
					$ionicPopup.show({
					  template: '',
					  title: 'Username or password is wrong',
					  scope: $scope,
					  buttons: [
						{
						  text: 'Ok',
						  type: 'button-assertive'
						},
					  ]
					})
				}
			});
		}
	};
	
	
	// for registration
	$scope.register = function(user) {
		var email = user.register_email;
		var password = user.register_password;
		var cpassword = user.register_cpassword;
		var firstname = user.register_fname;
		var lastname = user.register_lname;
		var phone = user.register_phone;
		var country = user.register_country;
		var dial_code = user.register_dial_code;
		
		var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z\-])+\.)+([a-zA-Z]{2,4})+$/;
		
		if(typeof email === "undefined" || typeof password === "undefined" || email == "" || password == "" || typeof cpassword === "undefined" || cpassword == "" || typeof firstname === "undefined" || firstname == "" || phone == "" || phone == "undefined" || lastname == "" || lastname == "undefined"  || country == "" || country == "undefined"  || dial_code == "" || dial_code == "undefined" ){
			$ionicPopup.show({
			  template: '',
			  title: 'Please fill all fields',
			  scope: $scope,
			  buttons: [
				{ 
				  text: 'Ok',
				  type: 'button-assertive'
				},
			  ]
			})
		}
		else
		{
			if(password != cpassword){
				$ionicPopup.show({
				  template: '',
				  title: 'Password did not match',
				  scope: $scope,
				  buttons: [
					{ 
					  text: 'Ok',
					  type: 'button-assertive'
					},
				  ]
				})
			}
			else{
				if(!filter.test(email)){
					$ionicPopup.show({
							  template: '',
							  title: 'Please enter valid email',
							  scope: $scope,
							  buttons: [
								{ 
								  text: 'Ok',
								  type: 'button-assertive'
								},
							  ]
					})
				}
				else
				{
					var action = "register";
					console.log(country);
					var data_parameters = "action="+action+"&user_email="+email+ "&password="+password+ "&firstname="+firstname+ "&phone="+phone+ "&lastname="+lastname+ "&country="+country+ "&dial_code="+dial_code;
					$http.post(globalurl,data_parameters, {
						headers: {'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'}
					})
					.success(function(response) {
						if(response[0].status == "Y"){
							$scope.user = {register_email: '',register_fname : '',register_lname : '',register_password : '',register_cpassword : '',register_phone : ''};
							$ionicPopup.show({
							  template: '',
							  title: 'You have registered Successfully',
							  scope: $scope,
							  buttons: [
								{
								  text: 'Ok',
								  type: 'button-assertive'
								},
							  ]
							})
						}
						else if(response[0].status == "E"){
							$ionicPopup.show({
							  template: '',
							  title: 'Phone already exists',
							  scope: $scope,
							  buttons: [
								{
								  text: 'Ok',
								  type: 'button-assertive'
								},
							  ]
							})
						}
						else{
							$ionicPopup.show({
							  template: '',
							  title: 'There is some server error',
							  scope: $scope,
							  buttons: [
								{
								  text: 'Ok',
								  type: 'button-assertive'
								},
							  ]
							})
						}
					});
				}
			}
		}
	};
	
	//for forgot
	$scope.forgot = function(user) {
		var email = user.forgot_email;
		
		if(typeof email === "undefined" || email == ""){
			$ionicPopup.show({
			  template: '',
			  title: 'Please enter email address.',
			  scope: $scope,
			  buttons: [
				{
				  text: 'Ok',
				  type: 'button-assertive'
				},
			  ]
			})
		}
		else{
			var action = "forgot";
			var data_parameters = "action="+action+"&user_email="+email;
			$http.post(globalurl,data_parameters, {
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'}
			})
			.success(function(response){
				if(response[0].status == "N"){
					$ionicPopup.show({
					  template: '',
					  title: 'Email address not registered.',
					  scope: $scope,
					  buttons: [
						{
						  text: 'Ok',
						  type: 'button-assertive'
						},
					  ]
					})
				}else{
					$scope.user = {forgot_email: ''};
					$ionicPopup.show({
					  template: '',
					  title: 'An email has been sent to the email address.',
					  scope: $scope,
					  buttons: [
						{
						  text: 'Ok',
						  type: 'button-assertive',
						},
					  ]
					})
				}
			});
		}
	}
});
