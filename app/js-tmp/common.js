"use strict";

var _promise = require("babel-runtime/core-js/promise");

var _promise2 = _interopRequireDefault(_promise);

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _stringify = require("babel-runtime/core-js/json/stringify");

var _stringify2 = _interopRequireDefault(_stringify);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var momentLast = Date.now();

if (window.frameCacheVars !== undefined) BX.addCustomEvent("onFrameDataReceived", function (json) {
	loadApp();
});else if (typeof BX != "undefined") BX.ready(function () {
	loadApp();
});else $(function () {
	loadApp();
});

var loadApp = function loadApp() {

	// $('.wrapper-index-top .main-slider__cont').css({
	// 	'max-height': $('.head__menu .menu').outerHeight()
	// })

	// if($(window).width() < 1000){
	// 	$(window).resize(function(){
	// 		$('.wrapper-index-top .main-slider__cont').css({
	// 			'max-height': $('.head__menu .menu').outerHeight()
	// 		})
	// 	});
	// }


	Vue.use(Vuex);
	window.store = new Vuex.Store({
		state: {
			userRegionId: +Cookies.getJSON("userRegionId") || null,
			userCity: Cookies.getJSON("userCity") || "",
			mainShop: localStorage && localStorage.shopsDataLast1 && Cookies.getJSON("mainShop") ? JSON.parse(localStorage.getItem("shopsDataLast1")).filter(function (item) {
				return item.id == Cookies.getJSON("mainShop").id;
			})[0] : "",
			regionsData: localStorage && localStorage.regionsData ? JSON.parse(localStorage.getItem('regionsData')) : {},
			shopsData: localStorage && localStorage.shopsDataLast1 ? JSON.parse(localStorage.getItem('shopsDataLast1')) : {},
			userPosition: Cookies.getJSON("geolocation") || false,
			inStock: window.ostatki ? JSON.parse(window.ostatki) : [],
			showCityPopup: false
		},
		mutations: {
			deleteMainShop: function deleteMainShop(state) {
				state.mainShop = {};

				Cookies.remove("mainShop");
			},
			setMainRegion: function setMainRegion(state, newRegionId) {
				state.userRegionId = newRegionId;
				Cookies.set("userRegionId", newRegionId, { expires: 30 });
			},
			setMainCity: function setMainCity(state, newCity) {
				if (state.userCity != newCity) this.commit("deleteMainShop");

				state.userCity = newCity;
				Cookies.set("userCity", (0, _stringify2.default)(newCity), { expires: 30 });
			},
			setMainShop: function setMainShop(state, id) {
				var shop = state.shopsData.filter(function (item) {
					return item.id == id;
				})[0],
				    cityId = shop.cityId,
				    regionId = state.regionsData.cities.filter(function (item) {
					return item.id == cityId;
				})[0].regionId;

				store.commit("setMainRegion", regionId);

				store.commit("setMainCity", state.regionsData.cities.filter(function (item) {
					return item.id == cityId;
				})[0]);

				state.mainShop = shop;

				var tmpShop = {
					cityId: shop.cityId,
					id: shop.id,
					xml_id: shop.xml_id
				};

				Cookies.set("mainShop", (0, _stringify2.default)(tmpShop), { expires: 30 });

				location.reload();
			},

			loadData: function () {
				var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(state) {
					var response, data, i, shop, distance;
					return _regenerator2.default.wrap(function _callee$(_context) {
						while (1) {
							switch (_context.prev = _context.next) {
								case 0:
									_context.next = 2;
									return $.ajax({
										url: "/include/ajax.php",
										type: "POST",
										data: "AJAX_ADD_CITY=Y",
										success: function success(response) {
											return response;
										}
									});

								case 2:
									response = _context.sent;
									data = JSON.parse(response);

									if (!state.userPosition) {
										_context.next = 15;
										break;
									}

									_context.t0 = _regenerator2.default.keys(data.shopsData);

								case 6:
									if ((_context.t1 = _context.t0()).done) {
										_context.next = 15;
										break;
									}

									i = _context.t1.value;
									shop = data.shopsData[i];

									if (!(isNaN(parseFloat(shop.lat)) || isNaN(parseFloat(shop.lng)))) {
										_context.next = 11;
										break;
									}

									return _context.abrupt("continue", 6);

								case 11:
									distance = getDistanceFromLatLonInKm(parseFloat(state.userPosition.LAT), parseFloat(state.userPosition.LNG), parseFloat(shop.lat), parseFloat(shop.lng));


									data.shopsData[i].distance = distance.toFixed(2);

									// shop.address = shop.address.replace("г. ", "").replace(" КО", "").replace(/\s+/g, " ");

									_context.next = 6;
									break;

								case 15:

									data.shopsData.sort(function (a, b) {
										var compA = a.address.toUpperCase();
										var compB = b.address.toUpperCase();

										return compA < compB ? -1 : compA > compB ? 1 : 0;
									});

									state.regionsData = data.regionsData;

									state.shopsData = data.shopsData;

									if (localStorage) {
										try {
											localStorage.setItem("regionsData", (0, _stringify2.default)(state.regionsData));
											localStorage.setItem("regionsDataTimestamp", momentLast);

											localStorage.setItem("shopsDataLast1", (0, _stringify2.default)(state.shopsData));
											localStorage.setItem("shopsDataTimestamp", momentLast);
										} catch (e) {
											console.log(e);
										}
									}

									store.commit("checkLocation");

								case 20:
								case "end":
									return _context.stop();
							}
						}
					}, _callee, undefined);
				}));

				function loadData(_x) {
					return _ref.apply(this, arguments);
				}

				return loadData;
			}(),
			checkLocation: function checkLocation(state) {
				if (state.userRegionId == null) {
					var findedRegion = state.regionsData.regions.filter(function (region) {
						return region.name == Cookies.getJSON("geolocation").REGION.replace("+", " ");
					});

					if (findedRegion.length) {
						state.userRegionId = findedRegion[0].id;
						window.app.$refs.citySelect.curRegion = +state.userRegionId;
					}
				}

				if (state.userCity == "") {
					var findedCity = state.regionsData.cities.filter(function (city) {
						return city.name == Cookies.getJSON("geolocation").CITY.replace("+", " ");
					});

					if (findedCity.length) {
						state.userCity = findedCity[0];
						setTimeout(function () {
							window.app.$refs.citySelect.curCity = +state.userCity.id;
						}, 100);

						state.showCityPopup = Cookies.get("cityPopupShowed") ? false : true;

						$(window).on("load", function (e) {
							$(".menu-mobile .city").html($("header .city").html());
						});
					} else {
						if (Cookies.get("age_confirmed")) app.showCityPopup(false);else app.showAgeConfirm();
					}
				}

				if (!Cookies.get("age_confirmed")) app.showAgeConfirm();
			}
		}
	});

	window.app = new Vue({
		el: "#page-wr",
		data: {
			headMessage: "",
			headMessageShow: false,
			headMessageClass: "notify",
			isShopsPopupOpened: false
		},
		store: store,
		mounted: function mounted() {
			console.log("mounted");

			// store.state.shopsData.sort((a, b) => {
			// 	let compA = a.address.toUpperCase(),
			// 		compB = b.address.toUpperCase();

			// 	return (compA < compB) ? -1 : (compA > compB) ? 1 : 0

			uploadInputmask();

			if (localStorage && localStorage.shopsDataLast || localStorage.shopsData) {
				localStorage.removeItem("shopsDataLast");
				localStorage.removeItem("shopsData");
			}

			if (localStorage && (!store.state.regionsData.length || !store.state.shopsData.length)) store.commit("loadData");else {
				if (!$(".app-block").length) this.showAgeConfirm();
			}

			loadScripts();

			//filter();

			// console.log(this.mainShop);

			// $('script:contains(CMenuOpener)').each((key, $script) => {
			// 	eval($script.innerText);
			// });
		},

		computed: {
			mainShop: function mainShop() {
				return store.state.mainShop;
			},
			userCity: function userCity() {
				return store.state.userCity;
			},
			cityPopup: function cityPopup() {
				return store.state.showCityPopup;
			}
		},
		methods: {
			showAgeConfirm: function showAgeConfirm() {
				if ($(".app-block").length) return;
				$.fancybox({
					href: '#age-forms',
					closeBtn: false,
					closeClick: false,
					helpers: {
						overlay: {
							closeClick: false
						}
					},
					keys: {
						close: null
					},
					beforeShow: function beforeShow() {
						$('body').addClass('fancy-active');
					},
					afterShow: function afterShow() {},
					afterClose: function afterClose() {
						$('body').removeClass('fancy-active');
					}
				});
			},

			showMessage: function () {
				var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(text, options) {
					return _regenerator2.default.wrap(function _callee2$(_context2) {
						while (1) {
							switch (_context2.prev = _context2.next) {
								case 0:
									if (!app.headMessageShow) {
										_context2.next = 4;
										break;
									}

									app.headMessageShow = false;
									_context2.next = 4;
									return new _promise2.default(function (resolve) {
										setTimeout(function () {
											resolve();
										}, 300);
									});

								case 4:

									app.headMessage = "";
									app.headMessageClass = "notify";

									app.headMessageShow = true;

									app.headMessage = text;

									if (options.class) app.headMessageClass = options.class;

									setTimeout(function () {
										app.headMessageShow = false;
									}, options.time || 2000);

								case 10:
								case "end":
									return _context2.stop();
							}
						}
					}, _callee2, undefined);
				}));

				function showMessage(_x2, _x3) {
					return _ref2.apply(this, arguments);
				}

				return showMessage;
			}(),
			setMainShop: function setMainShop(id) {},
			hideCityPopup: function hideCityPopup() {
				// Cookies.set("cityPopupShowed", 1);

				store.commit("setMainCity", this.userCity);

				store.state.showCityPopup = false;
			},
			getCurShopTime: function getCurShopTime() {
				var time = [];
				if (store.state.mainShop != "" && store.state.mainShop.time != "") {
					time = store.state.mainShop.time.split(" ");

					time = time[1].split("-");
				} else {
					time[0] = "9:00";
					time[1] = "22:00";
				}

				return time;
			},
			showShopPopup: function showShopPopup() {
				if ($(".app-block").length) return;

				var self = this;
				$("#menu-toggle").removeClass('open');
				$('body').removeClass("mobile-menu--open");

				$.fancybox({
					href: "#shops",
					beforeShow: function beforeShow() {
						$("body").addClass("fancy-active");
						self.isShopsPopupOpened = true;
					},
					afterClose: function afterClose() {
						$("body").removeClass("fancy-active");
						self.isShopsPopupOpened = false;
					}
				});
			},
			showCityPopup: function showCityPopup() {
				var isClosable = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

				if ($(".app-block").length) return;

				$("#menu-toggle").removeClass('open');
				$('body').removeClass("mobile-menu--open");

				if (!isClosable) $.fancybox({
					href: "#city",
					closeBtn: false,
					closeClick: false,
					helpers: {
						overlay: {
							closeClick: false
						}
					},
					keys: {
						close: null
					},
					beforeShow: function beforeShow() {
						$("body").addClass("fancy-active");
					},
					afterClose: function afterClose() {
						$("body").removeClass("fancy-active");
					},
					afterShow: function afterShow() {
						$.fancybox.update();
					}
				});else $.fancybox({
					href: "#city",
					beforeShow: function beforeShow() {
						$("body").addClass("fancy-active");
					},
					afterClose: function afterClose() {
						$("body").removeClass("fancy-active");
					},
					afterShow: function afterShow() {
						$.fancybox.update();
					}
				});
			}
		}
	});
};

Vue.component("datetime-pick", {
	props: {
		required: {
			type: Boolean,
			default: true
		}
	},
	data: function data() {
		return {
			dateTime: ""
		};
	},
	mounted: function mounted() {
		$(".order-form__date").append('<div class="order-form__calendar">\
      <div id="order-calendar" class="calendar"></div>\
    </div>');

		$('.order-form__calendar').toggle();
	},

	methods: {
		openCalendar: function openCalendar() {
			var _this = this;

			var todayDate = moment();
			var ionStartDate = todayDate.format("DD.MM.YYYY");

			if (todayDate.hour() >= 22) {
				ionStartDate = todayDate.add(1, 'days').format("DD.MM.YYYY");
			}

			var curYear = +moment().format("YYYY"),
			    nextYear = curYear + 1;

			$('.order-form__calendar').toggle();

			$("#order-calendar").ionCalendar({
				lang: "ru",
				sundayFirst: false,
				years: curYear + "-" + nextYear,
				format: 'DD.MM.YYYY',
				hideArrows: true,
				startDate: ionStartDate,
				onClick: function onClick(date) {
					window.cart_calendar_hours = $('.ic__time-select').val();

					var curDate = moment();
					curDate.locale("ru");
					curDate.minute(0);
					curDate.second(0);
					curDate.millisecond(0);

					var selectedDate = moment(date, 'DD.MM.YYYY');
					selectedDate.locale("ru");
					selectedDate.hour(window.cart_calendar_hours);
					//   selectedDate.hour(0);
					selectedDate.minute(0);
					selectedDate.second(0);
					selectedDate.millisecond(0);

					if (selectedDate.diff(curDate, 'hours') < 2) {
						selectedDate.hour(moment().add(2, 'hour').format('H'));
					}

					var date = selectedDate.format("HH:mm DD.MM.YYYY");
					//   date = selectedDate.format("DD.MM.YYYY");

					if (selectedDate.diff(curDate, 'hours') < 2 || selectedDate.diff(curDate, 'days') > 1) {
						// let text = "Заказ можно оформить только на сегодня и завтра c 9:00 до 22:00";

						var time = app.getCurShopTime();

						var text = "Заказ можно оформить только на сегодня и завтра c " + time[0] + " до " + time[1];

						app.showMessage(text, {
							time: 2500,
							class: "notify"
						});
						// showHeaderMessage('', 'error');
						return false;
					}

					$('.order-form__calendar').toggle();
					_this.dateTime = date;
				},
				onReady: function onReady(date) {
					var selectedDate = moment(date, 'DD.MM.YYYY');
					var curDate = moment();

					if (typeof window.cart_calendar_hours != 'undefined') {
						curDate.hour(window.cart_calendar_hours);
					} else {
						curDate.add(1, 'hour');
					}
					var dt = moment();
					var html = '<div class="ic__time"><select class="ic__time-select">';

					var time = app.getCurShopTime();

					var timeStart = time[0],
					    timeEnd = time[1];

					for (var i = +timeStart.split(":")[0]; i < +timeEnd.split(":")[0]; i++) {
						if (i < parseInt(moment().add(2, 'hour').format("H")) && selectedDate.format('DD') == moment().format('DD')) {
							continue;
						}
						if (i === parseInt(curDate.format("H"))) {
							html += '<option value="' + i + '" selected="selected">' + dt.hour(i).format("H") + ':00</option>';
						} else {
							html += '<option value="' + i + '">' + dt.hour(i).format("H") + ':00</option>';
						}
					}
					html += '</select></div>';
					$('.ic__header').append(html);

					$('.ic__time-select').change(function (e) {
						var hour = $(e.currentTarget).val();
						var date = _this.dateTime;
						if (date == "") date = moment().format('HH:mm DD.MM.YYYY');
						var selectedDate = moment(date, 'HH:mm DD.MM.YYYY');
						selectedDate.hour(hour);
						selectedDate.minute(0);
						selectedDate.second(0);
						_this.dateTime = selectedDate.format('HH:mm DD.MM.YYYY');
					});
				}
			});
		}
	}
});

Vue.component("features", {
	props: {
		rows: {
			type: Array,
			default: []
		}
	},
	template: '\
		<div class="features">\
			<table class="features-table">\
				<tr v-for="row in rows">\
					<td class="features-table__title">{{row.title}}</td>\
					<td class="features-table__content" v-html="row.content"></td>\
				</tr>\
			</table>\
		</div>'
});

Vue.component("city-select", {
	data: function data() {
		return {
			curRegion: store.state.userRegionId || "default",
			curCity: store.state.userCity != "" ? store.state.userCity.id : "default",
			isRegionSelected: store.state.userRegionId != null ? true : false,
			isCitySelected: store.state.userCity != "" ? true : false
		};
	},
	computed: {
		regionsList: function regionsList() {
			return store.state.regionsData.regions;
		},
		citiesList: function citiesList() {
			var _this2 = this;

			return store.state.regionsData.cities.filter(function (item) {
				return item.regionId == _this2.curRegion;
			});
		}
	},
	mounted: function mounted() {
		// store.commit("checkLocation");

		// this.curRegion = store.state.userRegionId || "default";
		// this.curCity = store.state.userCity != "" ? store.state.userCity.id : "default";
	},
	update: function update() {
		$.fancybox.update();
	},

	watch: {
		curRegion: function curRegion(val, oldVal) {
			this.isRegionSelected = true;
			this.curCity = "default";
		},
		curCity: function curCity(val, oldVal) {
			if (val == "default") this.isCitySelected = false;else this.isCitySelected = true;
		}
	},
	methods: {
		selectCity: function selectCity() {
			var _this3 = this;

			store.commit("setMainCity", store.state.regionsData.cities.filter(function (item) {
				return item.id == _this3.curCity;
			})[0]);

			store.commit("setMainRegion", this.curRegion);
			app.showMessage("Город успешно выбран", {
				class: "notify",
				time: 2000
			});

			$.fancybox.close();

			location.reload();
		}
	},
	template: '\
		<div class="forms__input-wrap">\
          <div class="forms-input-cont">\
              <select v-model="curRegion" name="regionSelect" class="forms__select">\
				<option value="default" disabled>Выберите регион</option>\
                <option v-for="region in regionsList" :value="region.id">{{region.name}}</option>\
              </select>\
             <label for="form-name" class="forms-label forms__label">Область</label>\
          </div>\
          <div v-if="isRegionSelected" class="forms-input-cont">\
              <select v-model="curCity" name="citySelect" class="forms__select">\
                  <option value="default" disabled>Выберите город</option>\
                  <option v-for="city in citiesList" :value="city.id">{{city.name}}</option>\
              </select>\
             <label for="form-name" class="forms-label forms__label">Город</label>\
          </div>\
          <div v-if="isCitySelected" style="width: 100%; justify-content: center;" class="forms__submit">\
            <a @click="selectCity()" class="btn btn-form">Да</a>\
          </div>\
        </div>\
    '
});

Vue.component("shops", {
	props: {
		isContacts: {
			type: Boolean,
			default: false
		}
	},
	data: function data() {
		return {
			search__input: "",
			isRegionSelected: Cookies.getJSON("userRegionId") ? true : false,
			isCitySelected: Cookies.getJSON("userCity") ? true : false,
			viewType: Cookies.get("shopsViewType") || "dist",
			curRegion: +Cookies.getJSON("userRegionId") || "default",
			curCity: Cookies.getJSON("userCity") ? +Cookies.getJSON("userCity").id : "default",
			curShop: Cookies.getJSON("mainShop") ? +Cookies.getJSON("mainShop").id : null,
			srollPane: null,
			map: null,
			mapId: "shops-map" + Math.random(),
			radioPrefix: Math.random(),
			isKart: window.ostatki ? true : false
		};
	},
	watch: {
		search__input: function search__input(val, oldVal) {
			//this.scrollPane.reinitialise();
		},
		viewRadio: function viewRadio(val, oldVal) {
			if (val == oldVal) return;
		},
		curRegion: function curRegion(val, oldVal) {
			if (val == oldVal) return;

			//store.commit("setMainRegion", val);

			this.isRegionSelected = true;
			this.isCitySelected = false;
			this.curCity = "default";
		},
		curCity: function curCity(val, oldVal) {
			if (val == oldVal || val == "default") return;

			// console.log(this.viewType);

			if (this.viewType == "map") {
				// this.destroyMap();
				// console.log(this.viewType);
				// this.viewType = "map";
				this.reinitMap();
			}

			// console.log(this.viewType);

			//store.commit("setMainCity", (this.citiesList.filter((item) => item.id == this.curCity))[0]);

			//this.isCitySelected = true;
			this.update();
		},
		viewType: function viewType(val, oldval) {
			switch (val) {
				case "map":
					this.initMap();
					break;

				default:
					this.sort();
				//this.initScroll();
			}
		}
	},
	mounted: function mounted() {
		// console.log(this.ostatki);

		// $(".shops-view__one:nth-child(2) label").trigger("click");

		// this.sort();

		if (this.isContacts) this.viewType = "map";

		// $(".shops-view__one:first-child label").trigger("click");

		// for (let i in this.filteredList)
		// console.log(this.filteredList[i].address);

		// this.initScroll();
		this.sort();

		//this.scrollPane.reinitialise();
	},
	updated: function updated() {
		// if ($(".shops-list__list").length && this.scrollPane == null){
		// 	this.scrollPane = $(".shops-list__list").jScrollPane();
		// 	this.scrollPane = this.scrollPane.data("jsp");
		// }else if ($(".shops-list__list").length){
		// 	this.scrollPane.reinitialise()
		// }else if (!$(".shops-list__list").length)
		// 	this.scrollPane = null

		$.fancybox.update();
	},

	methods: {
		initScroll: function initScroll() {
			// this.scrollPane = $(this.$el).find(".shops-list__list").jScrollPane();

			// this.scrollPane = this.scrollPane.data("jsp");

			// this.scrollPane.reinitialise();
		},
		destroyMap: function destroyMap() {
			// console.log(this.map);
			// this.map.destructor();
		},
		reinitMap: function reinitMap() {
			// this.map.removeAll();
			var coords = [],
			    center = [0, 0],
			    lat = 0,
			    lng = 0;

			for (var i in this.shopsList) {
				var shop = this.shopsList[i];

				if (!parseInt(this.ostatki[shop.xml_id]) && this.ostatki.length) continue;

				if (!isNaN(parseFloat(shop.lat)) && !isNaN(parseFloat(shop.lat))) {
					coords.push([parseFloat(shop.lat), parseFloat(shop.lng)]);
					lat += parseFloat(shop.lat);
					lng += parseFloat(shop.lng);
				}
			}

			var size = [$(this.$el).find(".shops__map").width(), $(this.$el).find(".shops__map").height()];

			var zoom = ymaps.util.bounds.getCenterAndZoom(ymaps.util.bounds.fromPoints(coords), size);

			// this.map.setZoom(zoom.zoom+0.4);

			this.map.setCenter(zoom.center, zoom.zoom);

			var objects = [],
			    cluster = new ymaps.Clusterer({
				preset: 'islands#nightClusterIcons',
				clusterIconColor: "#e31e24",
				hasBalloon: false,
				gridSize: 80
			}),
			    selectedID = false;

			for (var i in this.shopsList) {
				var _shop = this.shopsList[i];

				if (!parseInt(this.ostatki[_shop.xml_id]) && this.ostatki.length) continue;

				if (isNaN(parseFloat(_shop.lat)) || isNaN(parseFloat(_shop.lat))) continue;

				if (_shop.id != store.state.mainShop.id) _shop.balloonContent = '\
						<div class="shop-balloon">\
							<div class="shop-balloon__address">' + _shop.address + '</div>\
							<div class="shop-balloon__time">' + _shop.time + '</div>\
							<div v-if="shop.id != store.state.mainShop.id" class="shop-balloon__btn">\
								<span onclick="store.commit(\'setMainShop\', ' + _shop.id + ')" class="btn btn--rectangle shop-select">Выбрать</span>\
							</div>\
						</div>\
					';else _shop.balloonContent = '\
						<div class="shop-balloon">\
							<div class="shop-balloon__address">' + _shop.address + '</div>\
							<div class="shop-balloon__time">' + _shop.time + '</div>\
						</div>\
					';

				var placemark = new ymaps.Placemark([parseFloat(_shop.lat), parseFloat(_shop.lng)], {
					balloonContent: _shop.balloonContent
				}, {
					iconLayout: "default#image",
					iconImageHref: _shop.id != store.state.mainShop.id ? "/local/templates/vinsklad2017/img/ico-marker.png" : "/local/templates/vinsklad2017/img/ico-selected-marker.png",
					iconImageSize: _shop.id != store.state.mainShop.id ? [32, 43] : [28, 33]
				});

				if (_shop.id == store.state.mainShop.id) selectedID = {
					coords: [parseFloat(_shop.lat), parseFloat(_shop.lng)]
				};

				objects.push(placemark);
			}

			cluster.add(objects);

			this.map.geoObjects.add(cluster);

			if (!selectedID) {
				this.map.setBounds(cluster.getBounds(), {
					checkZoomRange: true
				});
			} else this.map.setCenter(selectedID.coords, 3);
		},
		initMap: function initMap() {
			var _this4 = this;

			var coords = [],
			    center = [0, 0],
			    lat = 0,
			    lng = 0;

			$(".shops__map-map").html("");

			ymaps.ready(function () {

				for (var i in _this4.shopsList) {
					var shop = _this4.shopsList[i];

					if (!parseInt(_this4.ostatki[shop.xml_id]) && _this4.ostatki.length) continue;

					if (!isNaN(parseFloat(shop.lat)) && !isNaN(parseFloat(shop.lng))) {
						coords.push([parseFloat(shop.lat), parseFloat(shop.lng)]);
						lat += parseFloat(shop.lat);
						lng += parseFloat(shop.lng);
					}
				}

				// center = [lng/coords.length, lat/coords.length];

				center = ymaps.util.bounds.getCenter(ymaps.util.bounds.fromPoints(coords));

				_this4.map = new ymaps.Map(_this4.mapId, {
					zoom: 11,
					center: center
					// controls: ['fullscreenControl']
				});

				var size = [$(_this4.$el).find(".shops__map").width(), $(_this4.$el).find(".shops__map").height()];

				var zoom = ymaps.util.bounds.getCenterAndZoom(ymaps.util.bounds.fromPoints(coords), size);

				_this4.map.setZoom(zoom.zoom + 0.4);

				var objects = [],
				    cluster = new ymaps.Clusterer({
					preset: 'islands#nightClusterIcons',
					clusterIconColor: "#e31e24",
					hasBalloon: false,
					gridSize: 80
				}),
				    selectedID = false;

				for (var i in _this4.shopsList) {
					var _shop2 = _this4.shopsList[i];

					if (!parseInt(_this4.ostatki[_shop2.xml_id]) && _this4.ostatki.length) continue;

					if (isNaN(parseFloat(_shop2.lat)) || isNaN(parseFloat(_shop2.lng))) continue;

					if (_shop2.id != store.state.mainShop.id) _shop2.balloonContent = '\
							<div class="shop-balloon">\
								<div class="shop-balloon__address">' + _shop2.address + '</div>\
								<div class="shop-balloon__time">' + _shop2.time + '</div>\
								<div class="shop-balloon__btn">\
									<span onclick="store.commit(\'setMainShop\', ' + _shop2.id + ')" class="btn btn--rectangle shop-select">Выбрать</span>\
								</div>\
							</div>\
						';else _shop2.balloonContent = '\
							<div class="shop-balloon">\
								<div class="shop-balloon__address">' + _shop2.address + '</div>\
								<div class="shop-balloon__time">' + _shop2.time + '</div>\
							</div>\
						';

					var placemark = new ymaps.Placemark([parseFloat(_shop2.lat), parseFloat(_shop2.lng)], {
						balloonContent: _shop2.balloonContent
					}, {
						iconLayout: "default#image",
						iconImageHref: _shop2.id != store.state.mainShop.id ? "/local/templates/vinsklad2017/img/ico-marker.png" : "/local/templates/vinsklad2017/img/ico-selected-marker.png",
						iconImageSize: _shop2.id != store.state.mainShop.id ? [32, 43] : [28, 33]
					});

					if (_shop2.id == store.state.mainShop.id) selectedID = {
						coords: [parseFloat(_shop2.lat), parseFloat(_shop2.lng)]
					};

					objects.push(placemark);
				}

				cluster.add(objects);

				_this4.map.geoObjects.add(cluster);

				if (!selectedID) {
					_this4.map.setBounds(cluster.getBounds(), {
						checkZoomRange: true
					});
				} else _this4.map.setCenter(selectedID.coords, 16);
			});
		},
		sort: function sort() {
			switch (this.viewType) {
				case "alph":
					this.shopsList.sort(function (a, b) {
						var compA = a.address.toUpperCase();
						var compB = b.address.toUpperCase();

						return compA < compB ? -1 : compA > compB ? 1 : 0;
					});
					break;

				case "dist":
					this.shopsList.sort(function (a, b) {
						return parseFloat(a.distance) - parseFloat(b.distance);
					});
					break;
			}

			// for (let i in this.filteredList){
			// 	let shop = this.filteredList[i];

			// 	console.log(shop.distance)
			// }
		},
		setViewMthod: function setViewMthod(method) {
			if (method == "map") {} else {}
			//this.initScroll();

			//this.type = method;
		},
		setMainShop: function setMainShop() {
			store.commit("setMainShop", this.curShop);
		},
		update: function update() {
			this.isCitySelected = false;
			this.isCitySelected = true;
			this.sort();
		}
	},
	computed: {
		filteredList: function filteredList() {
			var _this5 = this;

			this.sort();

			return this.shopsList.filter(function (item) {
				return ~item.address.toLowerCase().indexOf(_this5.search__input.toLowerCase());
			});
		},

		regionsList: function regionsList() {
			return store.state.regionsData.regions;
		},
		citiesList: function citiesList() {
			var _this6 = this;

			return store.state.regionsData.cities.filter(function (item) {
				return item.regionId == _this6.curRegion;
			});
		},
		shopsList: function shopsList() {
			var _this7 = this;

			if (!this.isKart) return store.state.shopsData.filter(function (item) {
				return item.cityId == _this7.curCity;
			});else {

				return store.state.shopsData.filter(function (item) {
					console.log(item.cityId, _this7.curCity, store.state.inStock[item.xml_id], item.xml_id);

					return item.cityId == _this7.curCity && parseInt(_this7.ostatki[item.xml_id]);
				});
			}
		},
		ostatki: function ostatki() {
			return store.state.inStock;
		}
	},
	template: '\
		<div class="shops">\
			<div class="shops__top">\
				<div v-if="$root.isShopsPopupOpened" class="city-select">\
					<div>\
						<select v-model="curRegion" class="city-select__region">\
							<option value="default" disabled>Выберите область</option>\
							<option v-for="region in regionsList" :value="region.id">{{ region.name }}</option>\
						</select>\
					</div>\
					<div>\
						<select v-if="isRegionSelected" v-model="curCity" class="city-select__city">\
							<option value="default" disabled>Выберите город</option>\
							<option v-for="city in citiesList" :value="city.id">{{ city.name }}</option>\
						</select>\
					</div>\
				</div>\
				<div v-else class="city-select">\
					<select v-model="curRegion" class="city-select__region">\
						<option value="default" disabled>Выберите регион</option>\
						<option v-for="region in regionsList" :value="region.id">{{ region.name }}</option>\
					</select>\
					<select v-if="isRegionSelected" v-model="curCity" class="city-select__city">\
						<option value="default" disabled>Выберите город</option>\
						<option v-for="city in citiesList" :value="city.id">{{ city.name }}</option>\
					</select>\
				</div>\
			</div>\
			<div v-if="isCitySelected" class="shops-filter">\
				<div class="shops-filter__radio">\
					<div class="shops-view">\
						<div class="shops-view__one">\
							<input type="radio"\
								class="shops-view__one-input"\
								value="dist"\
								:id="radioPrefix+\'dist\'"\
								v-model="viewType"\
							/>\
							<label\
								:for="radioPrefix+\'dist\'"\
								class="shops-view__label">\
								По удалённости\
							</label>\
						</div>\
						<div v-if="false" data="window.ostatki" class="shops-view__one">\
							<input type="radio"\
								class="shops-view__one-input"\
								value="count"\
								:id="radioPrefix+\'dist\'"\
								v-model="viewType"\
							/>\
							<label\
								:for="radioPrefix+\'dist\'"\
								class="shops-view__label">\
								По количеству\
							</label>\
						</div>\
						<div v-if="!isKart || shopsList.length" class="shops-view__one">\
							<input type="radio"\
								class="shops-view__one-input"\
								value="map"\
								:id="radioPrefix+\'view_map\'"\
								v-model="viewType"\
							/>\
							<label\
								:for="radioPrefix+\'view_map\'"\
								class="shops-view__label">\
								Карта \
							</label>\
						</div>\
						<div class="shops-view__one">\
							<input type="radio"\
								class="shops-view__one-input"\
								value="alph"\
								:id="radioPrefix+\'alph\'"\
								v-model="viewType"\
							/>\
							<label\
								:for="radioPrefix+\'alph\'"\
								class="shops-view__label">\
								По алфавиту\
							</label>\
						</div>\
				</div>\
				<div class="shops-filter__search">\
					<input v-if="viewType == \'alph\' || viewType == \'dist\'" type="text" class="shops-filter__search-input"\
						v-model="search__input" placeholder="Поиск" />\
				</div>\
			</div>\
			<div v-if="isCitySelected && (viewType == \'alph\' || viewType == \'dist\')" class="shops-list">\
				<ul class="shops-list__list">\
					<li v-if="!filteredList.length" class="no-results">По запросу ничего не найдено</li>\
					<!--  -->\
					<li v-if="!isKart || parseInt(ostatki[shop.xml_id])" v-for="shop in filteredList" class="shops-list__list-el">\
						<div class="radio">\
							<input\
								type="radio"\
								:name="radioPrefix+\'_+curshop\'"\
								class="radio__input"\
								:id="radioPrefix+\'_\'+shop.id"\
								v-model="curShop"\
								:value="shop.id"\
							/>\
							<label :for="radioPrefix+\'_\'+shop.id" class="radio__label">\
								<div class="shops-list__list-address">\
									<span>{{ shop.address }}</span>&nbsp;<span v-if="shop.draftbeer ==\'BEERRIVER\'" title="Есть разливное пиво" class="shops-list__list-beer"></span>\
								</div>\
								<div v-if="shop.time" class="shops-list__list-time"><span>{{ shop.time }}</span></div>\
								<div v-if="shop.distance" class="shops-list__list-dist"><span>{{ shop.distance }} км</span></div>\
								<div v-if="window.ostatki" class="shops-list__list-dist"><span>{{ ostatki[shop.xml_id] || 0 }} шт</span></div>\
							</label>\
						</div>\
					</li>\
					<li v-if="isKart && !shopsList.length" class="no-results">Товара нет в наличии</li>\
				</ul>\
			</div>\
			<div v-show="isCitySelected && viewType == \'map\'" class="shops__map">\
				<div :id="mapId" class="shops__map-map"></div>\
			</div>\
			<div v-if="curShop && (viewType == \'alph\' || viewType == \'dist\')" class="shop-select__cont">\
				<span @click="setMainShop()" class="btn btn--rectangle shop-select">Выбрать</span>\
			</div>\
		</div>\
	'
});

Vue.component("checks-filter", {
	props: {
		list: {
			type: Array,
			default: []
		},
		inputName: {
			type: String,
			default: "checks"
		}
	},
	data: function data() {
		return {
			search__input: "",
			toggleText: "Развернуть"
		};
	},
	computed: {
		filteredItems: function filteredItems() {
			var _this8 = this;

			return this.list.filter(function (item) {
				return ~item.name.toLowerCase().indexOf(_this8.search__input.toLowerCase());
			});
		}
	},
	methods: {
		toggleSearch: function toggleSearch() {
			this.toggleText = this.toggleText == "Развернуть" ? "Свернуть" : "Развернуть";
		}
	},
	template: '\
		<div class="filter-search">\
			<input type="text" placeholder="Поиск по значениям" v-model.trim="search__input" class="filter-search__input"/>\
			<ul class="filter__checks filter__checks--search">\
				<li v-for="(item, i) in filteredItems" class="filter__checks-el">\
					<div v-if="toggleText == \'Свернуть\' || i <= 5" class="checkbox">\
						<input :id="inputName+i" type="checkbox" :name="inputName" :checked="item.checked" class="checkbox__input"/>\
						<label :for="inputName+i" class="checkbox__label">{{ item.name }}</label>\
					</div>\
				</li>\
			</ul>\
			<div v-if="filteredItems.length > 5" class="filter-search__show">\
				<div @click="toggleSearch()" class="filter-show-toggle">{{ toggleText }}</div>\
			</div>\
		</div>'
});

Vue.component("price-filter", {
	props: {
		max: {
			type: Number,
			default: 10000
		},
		min: {
			type: Number,
			default: 0
		},
		minVal: {
			type: Number,
			default: 0
		},
		maxVal: {
			type: Number,
			default: 10000
		},
		step: {
			type: Number,
			default: 0.5
		},
		minName: {
			type: String,
			default: "min"
		},
		maxName: {
			type: String,
			default: "max"
		}
	},
	data: function data() {
		return {
			maxValue: 0,
			minValue: 0,
			$this: null,
			$range: null
		};
	},
	mounted: function mounted() {
		this.$this = $(this.$el);

		this.minValue = +this.minVal;
		this.maxValue = +this.maxVal;

		this.initSlider();
	},

	template: '\
		<div class="price-filter">\
			<div class="input-group">\
				<input type="tel" v-model.number="minValue" :name="minName" class="catalog-filter__input input-group__input"/>\
				<input type="tel" v-model.number="maxValue" :name="maxName" class="catalog-filter__input input-group__input"/>\
			</div>\
			<i class="price-filter__range range"></i>\
		</div>\
	',
	watch: {
		maxValue: function maxValue(val, oldVal) {
			this.$range.slider("values", 1, val);
		},
		minValue: function minValue(val, oldVal) {
			this.$range.slider("values", 0, val);
		}
	},
	methods: {
		initSlider: function initSlider() {
			var self = this;

			this.$range = this.$this.find(".range").slider({
				animate: "normal",
				min: +self.min,
				max: +self.max,
				values: [+self.minValue, +self.maxValue],
				range: true,
				step: +self.step,
				slide: function slide(e, ui) {
					self.minValue = ui.values[0];
					self.maxValue = ui.values[1];
				}
			});
		}
	}
});

var log = function log(str) {
	console.log(str);
},
    loadScripts = function loadScripts() {
	$(".fancybox").fancybox({
		beforeShow: function beforeShow() {
			$("body").addClass("fancy-active");
		},
		afterClose: function afterClose() {
			$("body").removeClass("fancy-active");
		}
	});

	$("body").on("click", ".mobile-head__top .head__shop-city", function () {
		app.showCityPopup();
	});

	$("body").on("click", ".mobile-head__top .head__shop-address .address", function () {
		app.showShopPopup();
	});

	$("body").on("click", ".mobile-head__top .head__shop-address .delete", function () {
		store.commit("deleteMainShop");
		location.reload();
	});

	$(".main-slider").slick({
		slide: ".main-slider__slide",
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: true,
		speed: 400,
		autoplay: true,
		// lazyLoad: "progressive",
		autoplaySpeed: 2000
	});

	$(".anketa_new-slider").slick({
		slide: ".anketa_new-slide",
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: true,
		speed: 400,
		autoplay: true,
		// lazyLoad: "progressive",
		autoplaySpeed: 2000
	});

	$(".tabs__tab").click(function () {
		var $this = $(this);

		if ($(this).hasClass("active")) return;

		var id = +$this.attr("data-id"),
		    $parent = $this.closest(".tabs");

		$parent.find(".tabs__tab.active, .tabs-content.active").removeClass("active");

		$parent.find(".tabs__tab[data-id='" + id + "'], .tabs-content[data-id='" + id + "']").addClass("active");
	});

	$(".cat-slider").slick({
		slidesToShow: 4,
		slidesToScroll: 1,
		slide: ".cat-slider__slide",
		autoplay: true,
		autoplaySpeed: 3000,
		responsive: [{
			breakpoint: 1000,
			settings: {
				slidesToShow: 3
			}
		}, {
			breakpoint: 820,
			settings: {
				slidesToShow: 2
			}
		}, {
			breakpoint: 660,
			settings: {
				slidesToShow: 1
			}
		}]
	});

	// слайдер в карточке товвара
	$(".another .cat-plate").slick({
		slidesToShow: 3,
		slidesToScroll: 1,
		slide: ".cat-plate__one-wrap",
		responsive: [{
			breakpoint: 820,
			settings: {
				slidesToShow: 2
			}
		}, {
			breakpoint: 660,
			settings: {
				slidesToShow: 1
			}
		}]
	});

	$(".bot-text__btn").click(function () {
		$(this).toggleClass("active");
		$(this).parent(".bot-text").toggleClass("active");
	});

	$(".catalog-nav__current").click(function () {
		var $this = $(this);

		$this.next(".catalog-nav__list").slideToggle(300);
	});

	$('.catalog-filter__button').click(function () {
		var $this = $(this);

		$this.next('.catalog-filter__bock').slideToggle(300);
	});

	$(".filter-block__title").click(function () {
		var $this = $(this);

		$this.next(".filter-block__content").slideToggle(300);

		setTimeout(function () {
			$this.parent(".filter-block").toggleClass("closed");
		}, 290);
	});

	$('.catalog__filter-btn').click(function () {
		$('.catalog-filter__bock').slideToggle('slow');
	});

	$(".price-filter").each(function (i, el) {
		var $this = $(el);

		var step = +$this.attr("data-step"),
		    $min = $this.find("input[data-min]"),
		    $max = $this.find("input[data-max]");

		var min = +$min.attr("data-min"),
		    max = +$max.attr("data-max");

		var $range = $this.find(".range").slider({
			animate: "normal",
			min: min,
			max: max,
			values: [$min.val(), $max.val()],
			range: true,
			step: step,
			slide: function slide(e, ui) {
				$min.val(ui.values[0]);
				$max.val(ui.values[1]);
			},
			change: function change(e, ui) {
				smartFilter.reload($min[0]);
			}
		});

		$this.find("input[type='tel']").on("keyup", function () {
			var id, val;

			if ($(this).attr("data-min")) {
				id = 0;
				val = +$(this).val() < min ? min : +$(this).val();
			} else if ($(this).attr("data-max")) {
				id = 1;
				val = +$(this).val() > max ? max : +$(this).val();
			}

			$range.slider("values", id, val);
		});
	});

	$('.tovar-slider').slick({
		slide: '.tovar-slider__slide',
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: false

	});

	$('.vacancy__item-header').click(function () {
		$(this).next().slideToggle('slow');
		$(this).toggleClass('active');
	});

	$('#menu-toggle').click(function () {
		$(this).toggleClass('open');
		$('body').toggleClass("mobile-menu--open");
	});

	$('.catalog__filter-btn').click(function () {
		$(this).toggleClass('filter-open');
		$('catalog-nav').slideToggle('slow');
	});

	if ($('body').hasClass('inner')) {
		$('.head__menu').each(function (i, el) {
			var $this = $(this);

			var title = 'Каталог',
			    catalogMenu = "";

			$this.find('.menu__link').each(function () {
				catalogMenu += '<li class="submenu__el">\
						<a href="' + $(this).attr("href") + '" class="submenu__link">' + $(this).text() + '</a>\
				</li>';
			});

			console.log(1243);

			$(".mobile-menu").append('<li class="mobile-menu__el">\
	       		<span class="mobile-menu__link sub">' + title + '</span>\
	       		<ul class="submenu"><li class="submenu__el submenu__back">Назад</li>' + catalogMenu + '</ul>\
	       	</li>');
		});
	};

	console.log(1243);

	$(".footer-menu__cont").each(function (i, el) {
		var $this = $(el);

		var title = $this.find(".footer-menu__title").text(),
		    submenu = "";

		$this.find(".footer-menu__link").each(function (i, el) {
			var $this = $(el);

			submenu += '<li class="submenu__el">\
			<a href="' + $this.attr("href") + '" class="submenu__link">' + $this.text() + '</a>\
		</li>';
		});

		$(".mobile-menu").append('<li class="mobile-menu__el">\
   		<span class="mobile-menu__link sub">' + title + '</span>\
   		<ul class="submenu"><li class="submenu__el submenu__back">Назад</li>' + submenu + '</ul>\
   	</li>');
	});

	$('.catalog-nav').each(function (i, el) {
		var $this = $(el);

		var title = 'Категории',
		    categoryList = "";

		$this.find('.catalog-nav__list-link').each(function (i, el) {
			var $this = $(el);

			categoryList += '<li class="submenu__el">\
				<a href="' + $this.attr("href") + '" class="submenu__link">' + $this.text() + '</a>\
			</li>';
		});

		$(".mobile-menu").append('<li class="mobile-menu__el">\
       		<span class="mobile-menu__link sub">' + title + '</span>\
       		<ul class="submenu"><li class="submenu__el submenu__back">Назад</li>' + categoryList + '</ul>\
       	</li>');
	});

	$('.head__top').clone().addClass("mobile-head__top").appendTo('.menu-mobile__wrap');
	$('.msgs').clone().removeClass("msgs").addClass("mobile-menu__message").appendTo('.menu-mobile__wrap');

	if ($(window).width() < 820) {

		var fooerSoc = $('.footer__soc .soc').clone().removeClass('soc').addClass('js__mobile-soc');
		$('.mobile-menu__message').prepend(fooerSoc);
	};

	$("body").on("click", ".mobile-menu__link.sub, .submenu__back", function () {
		var $this = $(this);

		$this.closest('.mobile-menu__el').toggleClass('submenu-open');
	});

	$(".to-full").click(function (e) {
		Cookies.set("full-version", 1);
		location.reload();
	});

	$(".to-mobile").click(function (e) {
		Cookies.remove("full-version");
		location.reload();
	});

	$('input[type="file"]').change(function () {
		var value = $(this)[0].files[0].name;
		$(this).prev('.forms__input--file-support').val(value);
		$(this).next('.forms__input--file-support').val(value);
	});

	if ($("html").hasClass("bx-ie")) {
		$(".main-news__important").css({
			height: "auto"
		});
		$(".main-news").css({
			"min-height": $(".main-news__important").height()
		});
	}

	$(".main-slider__slide").each(function (i, el) {
		var $this = $(el);

		if ($this.find(".main-slider__slide-title").text() == "") $this.addClass("js__empty");
	});

	$(".catalog").prepend('<div class="js__dop-info"></div>');

	$(".title-block__cont").clone().addClass("js__title").appendTo(".js__dop-info");

	// $('.status-price-1').closest('.cat-plate__price, .cat-list__price').addClass('max');


	$('body').on('touchstart touchmove touchend', 'span.ui-slider-handle', function (event) {
		//mousevents to simulate on touch
		var touchEvents = {
			touchstart: 'mousedown',
			touchmove: 'mousemove',
			touchend: 'mouseup'
		};

		//get element and type of event to simulate
		var simulatedEvent = touchEvents[event.originalEvent.type],
		    touch = event.originalEvent.changedTouches[0],
		    mouseEvent = document.createEvent('MouseEvent');

		//return if no mouse event is matched
		if (typeof simulatedEvent === 'undefined') {
			return;
		}

		//init the mousevent if we have a matched event
		mouseEvent.initMouseEvent(simulatedEvent, //type
		true, //bubbles 
		true, //cancelable 
		window, //view 
		1, //detail 
		touch.screenX, //screenX
		touch.screenY, //screenY
		touch.clientX, //clientX
		touch.clientY, //clientY
		false, //ctrlKey
		false, //altKey
		false, //shiftKey
		false, //metaKey
		0, //button
		null //related target
		);

		//dispatch event on touched element
		touch.target.dispatchEvent(mouseEvent);
		event.preventDefault();
	});
};

var getDistanceFromLatLonInKm = function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2 - lat1); // deg2rad below
	var dLon = deg2rad(lon2 - lon1);
	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c; // Distance in km
	return d;
},
    deg2rad = function deg2rad(deg) {
	return deg * (Math.PI / 180);
};
//# sourceMappingURL=common.js.map
