var $$ = Dom7;

var base_path = 'http://ksm-if.com/xxii-ext/';
var app_path = base_path + 'application/';
var asset_path = base_path + 'asset/';

var app = new Framework7({
	name: 'XXII 2',
	id: 'com.zyxave.xxii2',
	root: '#app',
	theme: 'md',
	cache: false,
	panel: { swipe: 'left' },
	routes: [
		{
			path: '/index/',
			url: 'index.html',
		},
		{
			path: '/home/',
			url: 'pages/home.html',
			on: {
				pageInit: function(e, page){
					// console.log(localStorage.secretadmin);

					app.panel.enableSwipe();

					app.request.post(app_path + 'movies.php', 
						{ 
							action: 'getMovies',
							path: asset_path 
						},
						function(data){
							var obj = JSON.parse(data);
							var html = Template7.compile($$('#t7Home').html())(obj);
							$$('#listMovies').html(html);
						});

					if(!sessionStorage.opened){
						sessionStorage.opened = 'opened';
						$$('#btnlogout').on('click', function(){
							app.dialog.confirm("Are you sure?", "Logout", function(){
								app.dialog.progress();
								setTimeout(function(){
									app.dialog.close();
									localStorage.removeItem('userId');
									page.router.navigate('/login/', { animate: false, reloadAll: true });
								}, 500);
							});
						});
					}
				},
			},
		},
		{
			path: '/login/',
			url: 'pages/login.html',
			on: {
				pageInit: function(e, page){
					// app.dialog.alert(localStorage.getItem('secretadmin'));
					app.panel.disableSwipe();

					var uid, devInfo;

					/*
						Check if device already has DEVICE INFO
						If not then set localstorage for device info
					*/
					if(!localStorage.getItem('devInfo')){
						devInfo = app.device.os + "/" + app.device.osVersion;
						localStorage.setItem('devInfo', devInfo);
					}

					/*
						Check if device already has UID
						If not then request server for UID
					*/
					if(localStorage.getItem('uid')){
						uid = localStorage.getItem('uid');
					}
					else if(!localStorage.getItem('uid')){
						devInfo = localStorage.getItem('devInfo');
						app.request.post(app_path + 'devices.php',
							{
								action: 'initDevice',
								devInfo: devInfo
							},
							function(data){
								var obj = JSON.parse(data);
								localStorage.setItem('uid', obj);
							});
					}

					/*
						Do when button LOGIN clicked
					*/

					$$('#btnlogin').on('click', function(){
						// localStorage.clear();

						// app.dialog.progress();

						var username = $$('#username').val();
						var password = $$('#password').val();

						var secretStorage = 'secret' + username;
						var secret = "none";

						var uid = localStorage.getItem('uid');
						var devInfo = localStorage.getItem('devInfo');

						if(localStorage.getItem(secretStorage)){
							secret = localStorage.getItem(secretStorage);
						}

						// console.log(secret);

						uid = localStorage.getItem('uid');

						app.request.post(app_path + 'users.php', 
							{ 
								action: 'login', 
								user: username, 
								pass: password,
								uid: uid,
								devInfo: devInfo,
								secret: secret
							},
							function(data){
								var obj = JSON.parse(data);
								// app.dialog.alert(obj);

								setTimeout(function(){ 
									app.dialog.close();

									if(obj.substr(0, 3) == 'USP'){
										app.dialog.alert("Invalid username or password!");
									}
									else if(obj.substr(0, 3) == 'BLK'){
										app.dialog.alert("Your device has been blocked by the administrator.");
									}
									else if(obj.substr(0, 3) == 'SEC'){
										app.dialog.confirm(
											"You don't have access to this account!\nWould you like to sync access now?",
											"Require Access",
											function(e){
												app.dialog.alert(
													"To sync access, scan the QR code on your other device.\n" +
													"Menu > Manage Devices > Generate Access Code",
													"Require Access",
													function(x){
														cordova.plugins.barcodeScanner.scan(onSuccess, onFail);

														function onSuccess(result){
															if(!result.cancelled)
												            {
												                if(result.format == "QR_CODE")
												                {
												                	// app.dialog.alert(result.text);
												                	
												                	/* 
												                		example.com?index1=value1&index2=value2
											                		*/
												                	var query = result.text.split("?")[1];

												                	var secQuery = query.split("&")[0];
												                	var secret = secQuery.split("=")[1];

												                	var issuerQuery = query.split("&")[1];
												                	var issuer = issuerQuery.split("=")[1];

												                	if(issuer == 'XXII-EXT'){
												                		var uid = localStorage.getItem('uid');
												                		var info = localStorage.getItem('devInfo');
												                		var secStorage = 'secret' + username;

												                		app.request.post(app_path + 'devices.php',
													                		{
													                			action: 'addDevice',
													                			user: username,
													                			pass: password,
													                			uid: uid,
													                			devInfo: info,
													                			secret: secret
													                		},
													                		function(data){
													                			var obj = JSON.parse(data);

													                			if(obj == 'SEC'){
													                				app.dialog.alert("Invalid Access Code!");
													                			}
													                			else if(obj == 'ERR'){
													                				app.dialog.alert("SYSTEM ERROR!");
													                			}
													                			else{
													                				// app.dialog.alert(secStorage);
													                				localStorage.setItem(secStorage, secret);
													                				localStorage.setItem('userId', obj);
																					page.router.navigate('/home/', { reloadAll: true });
													                			}
													                		});
												                	}
												                	else{
												                		app.dialog.alert("Unknown QR Code!");
												                	}
												                }
												            }
														}

														function onFail(error){
															app.dialog.alert("Scanning failed: " + error);
														}
													});
											});
									}
									else if(obj.substr(0, 3) == 'ERR'){
										app.dialog.alert("SYSTEM ERROR!");
									}
									else if(obj.substr(0, 3) == 'VRF'){
										var notif = app.notification.create({
										  title: 'XXII',
										  titleRightText: 'now',
										  subtitle: "Device's not verified",
										  text: "To verify this device go to Menu > Manage Devices > Verify.",
										});
										notif.open();

										localStorage.setItem('userId', obj.slice(3));
										page.router.navigate('/home/', { reloadAll: true });
									}
									else if(obj.substr(0, 3) == 'SUC'){
										localStorage.setItem('userId', obj.slice(3));
										page.router.navigate('/home/', { reloadAll: true });
									}
								}, 500);
							});
					});
				},
				pageAfterIn: function(e, page){
					/*
						Check if device can autologin
					*/
					if(localStorage.getItem('userId')){
						app.dialog.progress();

						var userId = localStorage.getItem('userId');
						var uid = localStorage.getItem('uid');

						app.request.post(app_path + "devices.php",
							{
								action: 'checkAutologin',
								userId: userId,
								uid: uid
							},
							function(data){
								var obj = JSON.parse(data);

								if(obj == 'DEV'){
									localStorage.removeItem('userId');
									app.dialog.alert("Device's not recognized!");
								}
								else if(obj == 'BLK'){
									localStorage.removeItem('userId');
									app.dialog.alert("Your device were blocked by the administrator.");
								}
								else if(obj == 'VRF'){
									localStorage.removeItem('userId');
									var notif = app.notification.create({
									  title: 'XXII',
									  titleRightText: 'now',
									  subtitle: "Device's not verified",
									  text: "You need to login every time you open this app.",
									});
									notif.open();
								}
								else if(obj == 'SUC'){
									page.router.navigate('/home/', { reloadAll: true });
								}
								else if(obj == 'SEC'){
									app.dialog.alert("You don't have access to this account!");
								}
								else if(obj == 'ERR'){
									localStorage.removeItem('userId');
									app.dialog.alert("SYSTEM ERROR!");
								}

								app.dialog.close();
							});
					}
				}
			},
		},
		{
			path: '/register/',
			url: 'pages/register.html',
			on: {
				pageInit: function(e, page){
					app.panel.disableSwipe();

					var nameValid = false;
					var userValid = false;
					var passValid = false;
					var confirmed = false;

					$$('#nameR').on('focusout', function(){
						if(!$$('#nameR').hasClass('input-invalid')){ nameValid = true; }
						else{ nameValid = false; }
					});

					$$('#usernameR').on('focusout', function(){
						if(!$$('#usernameR').hasClass('input-invalid')){ userValid = true; }
						else{ userValid = false; }
					});

					$$('#passwordR').on('focusout', function(){
						if(!$$('#passwordR').hasClass('input-invalid')){ passValid = true; }
						else{ passValid = false; }
					});

					$$('#confirmR').on('focusout', function(){
						if($$('#confirmR').val() != $$('#passwordR').val()){
							$$('.match').css('visibility', 'visible');
							$$('.match').css('display', 'block');
							confirmed = false;
						}
						else{
							confirmed = true;
						}
					});

					$$('#confirmR').on('focusin', function(){
						$$('.match').css('visibility', 'hidden');
						$$('.match').css('display', 'none');
					});

					/*
						Do when button REGISTER clicked
					*/
					$$('#btnregister').on('click', function(){
						app.dialog.progress();

						if(confirmed && nameValid && userValid && passValid){
							var username = $$('#usernameR').val();
							var password = $$('#passwordR').val();
							var name = $$('#nameR').val();
							var devInfo = localStorage.getItem('devInfo');
							var uid = localStorage.getItem('uid');

							app.request.post(app_path + 'users.php', 
								{ 
									action: 'register', 
									user: username, 
									pass: password, 
									name: name,
									uid: uid
								},
								function(data){
									// console.log(data);
									var obj = JSON.parse(data);
									// app.dialog.alert(obj);
										
									if(obj.substr(0, 3) == 'USP'){
										app.dialog.alert("Username already exists!", "Failed",
											function(e){
												page.router.navigate('/register/');
											});
									}
									else if(obj.substr(0, 3) == 'SUC'){
										localStorage.setItem('secret' + username, obj.slice(3));
										app.dialog.alert("Registered!", "Success",
											function(e){
												page.router.navigate('/login/');
											});
										// app.dialog.alert(obj);
									}

									app.dialog.close();
								});
						}
						else if(!confirmed){
							setTimeout(function(){
								app.dialog.close();
								app.dialog.alert("Password doesn't match.", "ERROR");
							}, 500);
						}
						else{
							setTimeout(function(){
								app.dialog.close();
								app.dialog.alert("Please match the requested format.", "ERROR");
							}, 500);
						}
					});
				},
			},
		},
		{
			path: '/profile/',
			url: 'pages/profile.html',
			on: {
				pageInit: function(e, page){
					var userId = localStorage.userId;

					app.request.post(app_path + 'users.php', 
						{ 
							action: 'getProfiles', 
							userId: userId,
							path: asset_path
						},
						function(data){
							var obj = JSON.parse(data);

							$$('#propic').attr('src', obj['picture']);

							var html = Template7.compile($$('#t7Profile').html())(obj);
							$$('.page-content').html(html);

							$$('#btnpic').on('click', function(e){
								navigator.camera.getPicture(onSuccess, onFail, {
								  quality: 100,
								  destinationType: Camera.DestinationType.DATA_URL,
								  sourceType: Camera.PictureSourceType.CAMERA,
								  encodingType: Camera.EncodingType.JPEG,
								  mediaType: Camera.MediaType.PICTURE,
								  correctOrientation: true
								});

								var imgURI = $$('#propic').attr('src');
								app.dialog.alert(imgURI);
								var options = new FileUploadOptions();
								options.fileKey = "photo";
								options.fileName = imgURI.substr(imgURI.lastIndexOf('/') + 1);
								options.mimeType = "image/jpeg";
								options.params = { id: "ini id"	};
							});

							function onSuccess(imageData){
								$$('#propic').attr('src', 'data:image/jpeg; base64,' + imageData);
								// $$('#propic').attr('src', imageData);
							}

							function onFail(message){
								app.dialog.alert("Failed because: " + message);
							}
						});
				},
			},
		},
		{
			path: '/history/',
			url: 'pages/history.html',
			on: {
				pageInit: function(e, page){
					var userId = localStorage.userId;

					app.request.post(app_path + 'tickets.php', 
					{
						action: 'getHistory',
						userId: userId,
					},
					function(data){
						var obj = JSON.parse(data);
						var html = Template7.compile($$('#t7History').html())(obj);
						$$('.page-content').html(html);
					});
				},
			},
		},
		{
			path: '/password/',
			url: 'pages/password.html',
			on: {
				pageInit: function(e, page){
					var passValid = false;
					var confirmed = false;

					$$('#passwordC').on('focusout', function(){
						if(!$$('#passwordC').hasClass('input-invalid')){ passValid = true; }
						else{ passValid = false; }
					});

					$$('#confirmC').on('focusout', function(){
						if($$('#confirmC').val() != $$('#passwordC').val()){
							$$('.match').css('visibility', 'visible');
							$$('.match').css('display', 'block');
							confirmed = false;
						}
						else{
							confirmed = true;
						}
					});

					$$('#confirmC').on('focusin', function(){
						$$('.match').css('visibility', 'hidden');
						$$('.match').css('display', 'none');
					});

					$$('#btnchange').on('click', function(){
						var newpass = $$('#passwordC').val();

						if(confirmed && passValid){
							app.dialog.password("Enter current password", function(password){
								app.dialog.progress();
								app.request.post(app_path + 'users.php',
									{
										action: 'changePassword',
										userId: localStorage.userId,
										pass: password,
										newpass: newpass
									},
									function(data){
										var obj = JSON.parse(data);

										setTimeout(function(){ 
											app.dialog.close(); 

											if(obj == 1){
												app.dialog.alert("Password changed!", function(e){
													page.router.navigate('/home/');
												});
											}
											else if(obj == 0){
												app.dialog.alert("Invalid password!", function(e){
													$$('#passwordC').val("");
													$$('#confirmC').val("");
												});
											}
											else{
												app.dialog.alert("Error: -1", "Error");
											}
										}, 1000);
									});
							});
						}
						else{
							app.dialog.alert("Please match the requested format.", "ERROR");
						}
					});
				},
			},
		},
		{
			path: '/ticket/:movieId',
			url: 'pages/ticket.html',
			on:{
				pageInit: function(e, page){

					var movieId = page.router.currentRoute.params.movieId;
					var showtime, studio, qty;

					app.request.post(app_path + 'movies.php', 
						{ 
							action: 'getMoviesById', 
							movieId: movieId 
						},
						function(data){
							var title = JSON.parse(data)[0]['title'];
							$$('#textTitle').val(title);
						});

					function getAvailable(){
						studio = $$('select[name="studio"]').val();
						showtime = $$('select[name="showtime"]').val();

						app.request.post(app_path + 'tickets.php', 
							{ 
								action: 'getSeats', 
								movieId: movieId, 
								studio: studio, 
								showtime: showtime 
							},
							function(data){
								var seat = JSON.parse(data);
								if(seat.length > 0){
									$$('#able-seat').html("Available: " + seat.length + " seat(s)");

									var ablecode = "Seats: ";
									for(var i = 0; i < seat.length; i++){
										ablecode += seat[i];
										if(i != seat.length - 1){
											ablecode += ", ";
										}
									}
									$$('#able-code').html(ablecode);

									if(seat.length > 0){
										$$('#btnpick').removeClass('disabled');
										$$('#qty').html("");

										var maxQty = 5;
										if(seat.length < maxQty){
											maxQty = seat.length;
										}

										for(var i = 1; i <= maxQty; i++){
											if(i == 1){
												$$('#qty').append("<option value='" + i + " selected'>" + i + "</option>");
											}
											else{
												$$('#qty').append("<option value='" + i + "'>" + i + "</option>");
											}
										}
										
										qty = $$('select[name="qty"]').val();
									}
									else{
										$$('#btnpick').addClass('disabled');
									}
								}
							});
					}

					getAvailable();

					$$('select[name="studio"]').on('change propertychange', function(){
						getAvailable();
					});
					$$('select[name="showtime"]').on('change propertychange', function(){
						getAvailable();
					});
					$$('select[name="qty"]').on('change propertychange', function(){
						qty = $$('select[name="qty"]').val();
					});

					$$('#btnpick').on('click', function(){
						 page.router.navigate('/seat/' + movieId + '/' + showtime + '/' + studio + '/' + qty);
					});
				},
			},
		},
		{
			path: '/seat/:movieId/:showtime/:studio/:qty',
			url: 'pages/seat.html',
			on: {
				pageInit: function(e, page){

					var movieId = page.router.currentRoute.params.movieId;
					var showtime = page.router.currentRoute.params.showtime;
					var studio = page.router.currentRoute.params.studio;
					var qty = page.router.currentRoute.params.qty.split(" ")[0];
					var qtytemp = qty;
					var seatlist = '';

					$$('.btnback').attr("href", "/ticket/" + movieId);

					app.request.post(app_path + 'tickets.php', 
						{ 
							action: 'getSeats', 
							movieId: movieId, 
							studio: studio, 
							showtime: showtime
						},
						function(data){
							var seat = JSON.parse(data);

							$$('.block-title').append(
								"<span id='spanqty'><br><br><b>You must pick " + qtytemp + " seat(s) before proceeding.</b></span>");
							for(var i = 0; i < seat.length; i++){
								$$('#seatlist').append(
									'<li>' +
						            '<span>' + seat[i] + '</span>' +
						            '<label class="toggle toggle-init color-blue">' +
						              '<input class="tog-input" type="checkbox" name="seat" value="' + seat[i] + '">' +
						              '<span class="toggle-icon tog-icon" data-code="' + seat[i] + '"></span>' +
						            '</label>' +
						          	'</li>');
							}

							$$('.toggle').on('change', function(){
								$$(this).toggleClass('checked');
								if($$(this).hasClass('checked')){
									qtytemp--;
								}
								else{
									qtytemp++;
								}

								if(qtytemp <= 0){
									for(var i = 0; i < seat.length; i++){
										if(!$$('input[value="' + seat[i] + '"]').parent().hasClass('checked')){
											$$('input[value="' + seat[i] + '"]').parent().addClass('disabled');
										}
									}
									$$('#btnconfirm').removeClass('disabled');

									$$('#spanqty').html('<br><br><b>You\'re ready to continue.</b>');
								}
								else if(qtytemp > 0){
									$$('.toggle').removeClass('disabled');
									if(!$$('#btnconfirm').hasClass('disabled')){
										$$('#btnconfirm').addClass('disabled');
									}

									$$('#spanqty').html('<br><br><b>You must pick ' + qtytemp + ' seat(s) to continue.</b>');
								}
							});

							$$('#btnconfirm').on('click', function(){
								app.dialog.confirm("Are you sure?", "Purchase",
									function(e){
										seatlist = '';
										for(var i = 0; i < seat.length; i++){
											if($$('input[value="' + seat[i] + '"]').parent().hasClass('checked')){
												if(seatlist == ''){
													seatlist += seat[i];
												}
												else{
													seatlist += ', ' + seat[i];
												}
											}
										}

										page.router.navigate('/purchase/' + movieId + '/' + showtime + '/' + studio + '/' + qty + '/' + seatlist);
								});
							});
						});
				},
			},
		},
		{
			path: '/purchase/:movieId/:showtime/:studio/:qty/:seatlist',
			url: 'pages/purchase.html',
			on: {
				pageInit: function(e, page){
					app.panel.disableSwipe();

					var movieId = page.router.currentRoute.params.movieId;
					var showtime = page.router.currentRoute.params.showtime;
					var studio = page.router.currentRoute.params.studio;
					var qty = page.router.currentRoute.params.qty;
					var seatlist = page.router.currentRoute.params.seatlist;
					var userId = localStorage.userId;

					app.request.post(app_path + 'tickets.php', 
						{ 
							action: 'insertTickets', 
							movieId: movieId, 
							studio: studio, 
							showtime: showtime, 
							seatlist: seatlist,
							userId: userId
						},
						function(data){
							var obj = JSON.parse(data);

							var context = {
								title: obj['title'],
								date: obj['showdate'],
								studio: studio,
								showtime: obj['showtime'],
								seatlist: seatlist,
								qty: qty,
							};

							var html = Template7.compile($$('#t7Purchase').html())(context);
							$$('.page-content').html(html);
						});
				},
			},
		},
		{
			path: '/device/',
			url: 'pages/device.html',
			on: {
				pageInit: function(e, page){

					app.progressbar.show(app.theme === 'md' ? 'orange' : 'blue');

					var userId = localStorage.getItem('userId');
					var uid = localStorage.getItem('uid');

					setInterval(function(){
						
					}, 1000);

					app.request.post(app_path + 'devices.php', 
						{ 
							action: 'getDevices',
							userId: userId,
							uid: uid
						},
						function(data){
							var obj = JSON.parse(data);

							// console.log(data);
							if(obj == 'ERR'){
								app.dialog.alert("SYSTEM ERROR!");
							}
							else if(obj != 'ATH'){
								var html = Template7.compile($$('#t7Device').html())(obj);
								$$('#listDevices').html(html);
							}

							app.progressbar.hide();
						});

					/*
						Do when button generate clicked
					*/
					$$('#btnGenerate').on('click', function(){
						app.dialog.password("Enter password", function(password){
							app.request.post(app_path + 'users.php',
								{
									action: 'checkPassword',
									userId: userId,
									pass: password
								},
								function(data){
									var obj = JSON.parse(data);

									if(obj == 0){
										app.dialog.alert("Wrong password!");
									}
									else{
										app.router.navigate('/qrcode/');
									}
								});
						});
					});
				}
			}
		},
		{
			path: '/qrcode/',
			url: 'pages/qrcode.html',
			on: {
				pageInit: function(e, page){
					var userId = localStorage.getItem('userId');
					var username;

					app.request.post(app_path + 'users.php',
						{
							action: 'getUsername',
							userId: userId
						},
						function(data){
							var obj = JSON.parse(data);
							username = obj;

							var secretStorage = 'secret' + username;
							var secret = localStorage.getItem(secretStorage);

							app.request.post(app_path + 'devices.php',
								{
									action: 'getQR',
									username: username,
									secret: secret
								},
								function(data){
									var obj = JSON.parse(data);

									$$('#qrcode').prepend("<img src='" + obj + "'>");
								});
						});
				}
			}
		},
		{
			path: '/test/',
			url: 'pages/test.html',
			on: {
				pageInit: function(e, page){
					var text = app.device.os + " " + app.device.osVersion;
					$$('#testtext').html(text);
				}

				// pageInit: function(e, page){
				// 	var map = [
				// 		'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', //  7
				// 		'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', // 15
				// 		'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', // 23
				// 		'Y', 'Z', '2', '3', '4', '5', '6', '7', // 31
				// 		'=' // padding character
				// 	];

				// 	function pad (str, max, padStr = '0', type = 'right') {
				// 	  str = str.toString();

				// 	  if(type == 'right'){
				// 	  	return str.length < max ? pad(str + padStr, max, '0', 'right') : str;
				// 	  }
				// 	  else if(type == 'left'){
				// 	  	return str.length < max ? pad(padStr + str, max, '0', 'left') : str;
				// 	  }
				// 	}

				// 	function encode(input, padding = true){
				// 		if(input === ""){ return ""; }

				// 		var input = input.split("");
				// 		var binaryString = "";

				// 		for(var i = 0; i < input.length; i++){
				// 			binaryString += pad((input[i].charCodeAt(0)).toString(2), 8, '0', 'left');
				// 		}

				// 		var fiveBitBinaryArray = binaryString.match(/.{1,5}/g);
				// 		var base32 = "";
				// 		var i = 0;

				// 		while(i < fiveBitBinaryArray.length){
				// 			base32 += map[parseInt(pad(fiveBitBinaryArray[i], 5, '0', 'right'), 2)];
				// 			i++;
				// 		}

				// 		var x = binaryString;
				// 		if(padding && (x.length % 40) != 0){
				// 			if(x == 8){ base32 += map[32].repeat(6); }
				// 			else if(x == 16){ base32 += map[32].repeat(4); }
				// 			else if(x == 24){ base32 += map[32].repeat(3); }
				// 			else if(x == 32){ base32 += map[32]; }
				// 		}

				// 		return base32;
				// 	}

				// 	var text = encode("admin");
				// 	$$('#testtext').html(text);
				// }
			}
		},
	],
	navbar: {
		hideOnPageScroll: true,
		showOnPageScrollEnd: true,
	}
});

var mainView = app.views.create('.view-main', { url: '/login/' });