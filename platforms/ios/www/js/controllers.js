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
.controller('AuthCtrl', function($scope,$ionicHistory,$rootScope,$http,$ionicPopup,$state,$cordovaGeolocation) {
	var country_name = "";
	var country_dial_code = "";
	
	$scope.user = {username: '',password : ''};
    // hide back butotn in next view
	$ionicHistory.nextViewOptions({
      	disableBack: true
    });
	
	// country data array
	var countries = new Array();
	countries['Afghanistan'] = "+93";
	countries['Albania'] = "+355";
	countries['Algeria'] = "+213";
	countries['American Samoa'] = "+1";
	countries['Andorra'] = "+376";
	countries['Angola'] = "+244";
	countries['Anguilla'] = "+1";
	countries['Antigua'] = "+1";
	countries['Argentina'] = "+54";
	countries['Armenia'] = "+374";
	countries['Aruba'] = "+297";
	countries['Australia'] = "+61";
	countries['Austria'] = "+43";
	countries['Azerbaijan'] = "+994";
	countries['Bahrain'] = "+973";
	countries['Bangladesh'] = "+880";
	countries['Barbados'] = "+1";
	countries['Belarus'] = "+375";
	countries['Belgium'] = "+32";
	countries['Belize'] = "+501";
	countries['Benin'] = "+229";
	countries['Bermuda'] = "+1";
	countries['Bhutan'] = "+975";
	countries['Bolivia'] = "+591";
	countries['Bosnia and Herzegovina'] = "+387";
	countries['Botswana'] = "+267";
	countries['Brazil'] = "+55";
	countries['British Indian Ocean Territory'] = "+246";
	countries['British Virgin Islands'] = "+1";
	countries['Brunei'] = "+673";
	countries['Bulgaria'] = "+359";
	countries['Burkina Faso'] = "+226";
	countries['Burma Myanmar'] = "+95";
	countries['Burundi'] = "+257";
	countries['Cambodia'] = "+855";
	countries['Cameroon'] = "+237";
	countries['Canada'] = "+1";
	countries['Cape Verde'] = "+238";
	countries['Cayman Islands'] = "+1";
	countries['Central African Republic'] = "+236";
	countries['Chad'] = "+235";
	countries['Chile'] = "+56";
	countries['China'] = "+86";
	countries['Colombia'] = "+57";
	countries['Comoros'] = "+269";
	countries['Cook Islands'] = "+682";
	countries['Costa Rica'] = "+506";
	countries["Côte d'Ivoire"] = "+225";
	countries['Croatia'] = "+385";
	countries['Cuba'] = "+53";
	countries['Cyprus'] = "+357";
	countries['Czech Republic'] = "+420";
	countries['Democratic Republic of Congo'] = "+243";
	countries['Denmark'] = "+45";
	countries['Djibouti'] = "+253";
	countries['Dominica'] = "+1";
	countries['Dominican Republic'] = "+1";
	countries['Ecuador'] = "+593";
	countries['Egypt'] = "+20";
	countries['El Salvador'] = "+503";
	countries['Equatorial Guinea'] = "+240";
	countries['Eritrea'] = "+291";
	countries['Estonia'] = "+372";
	countries['Ethiopia'] = "+251";
	countries['Falkland Islands'] = "+500";
	countries['Faroe Islands'] = "+298";
	countries['Federated States of Micronesia'] = "+691";
	countries['Fiji'] = "+679";
	countries['Finland'] = "+358";
	countries['France'] = "+33";
	countries['French Guiana'] = "+594";
	countries['French Polynesia'] = "+689";
	countries['Gabon'] = "+241";
	countries['Georgia'] = "+995";
	countries['Germany'] = "+49";
	countries['Ghana'] = "+233";
	countries['Gibraltar'] = "+350";
	countries['Greece'] = "+30";
	countries['Greenland'] = "+299";
	countries['Grenada'] = "+1";
	countries['Guadeloupe'] = "+590";
	countries['Guam'] = "+1";
	countries['Guatemala'] = "+502";
	countries['Guinea'] = "+224";
	countries['Guinea-Bissau'] = "+245";
	countries['Guyana'] = "+592";
	countries['Haiti'] = "+509";
	countries['Honduras'] = "+504";
	countries['Hong Kong'] = "+852";
	countries['Hungary'] = "+36";
	countries['Iceland'] = "+354";
	countries['India'] = "+91";
	countries['Indonesia'] = "+62";
	countries['Iran'] = "+98";
	countries['Iraq'] = "+964";
	countries['Ireland'] = "+353";
	countries['Israel'] = "+972";
	countries['Italy'] = "+39";
	countries['Jamaica'] = "+1";
	countries['Japan'] = "+81";
	countries['Jordan'] = "+962";
	countries['Kazakhstan'] = "+7";
	countries['Kenya'] = "+254";
	countries['Kiribati'] = "+686";
	countries['Kosovo'] = "+381";
	countries['Kuwait'] = "+965";
	countries['Kyrgyzstan'] = "+996";
	countries['Laos'] = "+856";
	countries['Latvia'] = "+371";
	countries['Lebanon'] = "+961";
	countries['Lesotho'] = "+266";
	countries['Liberia'] = "+231";
	countries['Libya'] = "+218";
	countries['Liechtenstein'] = "+423";
	countries['Lithuania'] = "+370";
	countries['Luxembourg'] = "+352";
	countries['Macau'] = "+853";
	countries['Macedonia'] = "+389";
	countries['Madagascar'] = "+261";
	countries['Malawi'] = "+265";
	countries['Malaysia'] = "+60";
	countries['Maldives'] = "+960";
	countries['Mali'] = "+223";
	countries['Malta'] = "+356";
	countries['Marshall Islands'] = "+692";
	countries['Martinique'] = "+596";
	countries['Mauritania'] = "+222";
	countries['Mauritius'] = "+230";
	countries['Mayotte'] = "+262";
	countries['Mexico'] = "+52";
	countries['Moldova'] = "+373";
	countries['Monaco'] = "+377";
	countries['Mongolia'] = "+976";
	countries['Montenegro'] = "+382";
	countries['Montserrat'] = "+1";
	countries['Morocco'] = "+212";
	countries['Mozambique'] = "+258";
	countries['Namibia'] = "+264";
	countries['Nauru'] = "+674";
	countries['Nepal'] = "+977";
	countries['Netherlands'] = "+31";
	countries['Netherlands Antilles'] = "+599";
	countries['New Caledonia'] = "+687";
	countries['New Zealand'] = "+64";
	countries['Nicaragua'] = "+505";
	countries['Niger'] = "+227";
	countries['Nigeria'] = "+234";
	countries['Niue'] = "+683";
	countries['Norfolk Island'] = "+672";
	countries['North Korea'] = "+850";
	countries['Northern Mariana Islands'] = "+1";
	countries['Norway'] = "+47";
	countries['Oman'] = "+968";
	countries['Pakistan'] = "+92";
	countries['Palau'] = "+680";
	countries['Palestine'] = "+970";
	countries['Panama'] = "+507";
	countries['Papua New Guinea'] = "+675";
	countries['Paraguay'] = "+595";
	countries['Peru'] = "+51";
	countries['Philippines'] = "+63";
	countries['Poland'] = "+48";
	countries['Portugal'] = "+351";
	countries['Puerto Rico'] = "+1";
	countries['Qatar'] = "+974";
	countries['Republic of the Congo'] = "+242";
	countries['Réunion'] = "+262";
	countries['Romania'] = "+40";
	countries['Russia'] = "+7";
	countries['Rwanda'] = "+250";
	countries['Saint Barthélemy'] = "+590";
	countries['Saint Helena'] = "+290";
	countries['Saint Kitts and Nevis'] = "+1";
	countries['Saint Martin'] = "+590";
	countries['Saint Pierre and Miquelon'] = "+508";
	countries['Saint Vincent and the Grenadines'] = "+1";
	countries['Samoa'] = "+685";
	countries['San Marino'] = "+378";
	countries['São Tomé and Príncipe'] = "+239";
	countries['Saudi Arabia'] = "+966";
	countries['Senegal'] = "+221";
	countries['Serbia'] = "+381";
	countries['Seychelles'] = "+248";
	countries['Sierra Leone'] = "+232";
	countries['Singapore'] = "+65";
	countries['Slovakia'] = "+421";
	countries['Slovenia'] = "+386";
	countries['Solomon Islands'] = "+677";
	countries['Somalia'] = "+252";
	countries['South Africa'] = "+27";
	countries['South Korea'] = "+82";
	countries['Spain'] = "+34";
	countries['Sri Lanka'] = "+94";
	countries['St. Lucia'] = "+1";
	countries['Sudan'] = "+249";
	countries['Suriname'] = "+597";
	countries['Swaziland'] = "+268";
	countries['Sweden'] = "+46";
	countries['Switzerland'] = "+41";
	countries['Syria'] = "+963";
	countries['Taiwan'] = "+886";
	countries['Tajikistan'] = "+992";
	countries['Tanzania'] = "+255";
	countries['Thailand'] = "+66";
	countries['The Bahamas'] = "+1";
	countries['The Gambia'] = "+220";
	countries['Timor-Leste'] = "+670";
	countries['Togo'] = "+228";
	countries['Tokelau'] = "+690";
	countries['Tonga'] = "+676";
	countries['Trinidad and Tobago'] = "+1";
	countries['Tunisia'] = "+216";
	countries['Turkey'] = "+90";
	countries['Turkmenistan'] = "+993";
	countries['Turks and Caicos Islands'] = "+1";
	countries['Tuvalu'] = "+688";
	countries['Uganda'] = "+256";
	countries['Ukraine'] = "+380";
	countries['United Arab Emirates'] = "+971";
	countries['United Kingdom'] = "+44";
	countries['United States'] = "+1";
	countries['Uruguay'] = "+598";
	countries['US Virgin Islands'] = "+1";
	countries['Uzbekistan'] = "+998";
	countries['Vanuatu'] = "+678";
	countries['Vatican City'] = "+39";
	countries['Venezuela'] = "+58";
	countries['Vietnam'] = "+84";
	countries['Wallis and Futuna'] = "+681";
	countries['Yemen'] = "+967";
	countries['Zambia'] = "+260";
	countries['Zimbabwe'] = "+263";

	// make array to json 
	
	
	
	$scope.getdialcode = function(value) {
		var datasplit = value.split(",");
		$scope.user = {register_dial_code: datasplit[0],login_dial_code: datasplit[0],register_country: datasplit[1]};
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
						// automatic set country and country code according to the location
						$scope.user = {register_dial_code : countries[country_name],login_dial_code: countries[country_name],register_country: country_name};
						
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
