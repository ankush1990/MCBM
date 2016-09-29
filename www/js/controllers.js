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
		var  global_login_id ="27";
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
	$scope.user = {username: '',password : ''};
    // hide back butotn in next view
	$ionicHistory.nextViewOptions({
      	disableBack: true
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
		
		var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z\-])+\.)+([a-zA-Z]{2,4})+$/;
		
		if(typeof email === "undefined" || typeof password === "undefined" || email == "" || password == "" || typeof cpassword === "undefined" || cpassword == "" || typeof firstname === "undefined" || firstname == "" || phone == "" || phone == "undefined" || lastname == "" || lastname == "undefined" ){
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
					var data_parameters = "action="+action+"&user_email="+email+ "&password="+password+ "&firstname="+firstname+ "&phone="+phone+ "&lastname="+lastname;
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
							  title: 'Email already exists',
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
