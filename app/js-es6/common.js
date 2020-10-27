
import is from "is_js";

var momentLast = Date.now();

if (window.frameCacheVars !== undefined)
    BX.addCustomEvent("onFrameDataReceived" , (json) => {
    	loadApp();
    });
else if (typeof(BX) != "undefined")
    BX.ready(() => {
    	loadApp();
    })
else
	$(() => {
		loadApp();
	})

const loadApp = () =>{


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


	


	Vue.use(Vuex)
	window.store = new Vuex.Store({
		state: { 
			userRegionId: +Cookies.getJSON("userRegionId") || null,
			userCity: Cookies.getJSON("_userCity") || "",
			mainShop: localStorage && localStorage.shopsDataLast1 && Cookies.getJSON("mainShop") ? JSON.parse(localStorage.getItem("shopsDataLast1"))
				.filter(item => item.id == Cookies.getJSON("mainShop").id)[0] : "",
			regionsData : localStorage && localStorage.regionsData ? JSON.parse(localStorage.getItem('regionsData')) : {},
      shopsData : localStorage && localStorage.shopsDataLast1 ? JSON.parse(localStorage.getItem('shopsDataLast1')) : {},
			userPosition: Cookies.getJSON("geolocation") || false,
			inStock: window.ostatki ? JSON.parse(window.ostatki) : [],
			showCityPopup: false,
		},
		mutations: {
			deleteMainShop (state) {

				let domain = "";

				if (this.state.userCity.subdomain)
					domain = `.vinsklad.ru`;
				else
					domain = "vinsklad.ru"

				Cookies.remove(
					"mainShop",
					{
						domain: domain
					}
				);

				state.mainShop = {};
			},
			setMainRegion (state, newRegionId) {
				state.userRegionId = newRegionId;
				Cookies.set(
					"userRegionId", 
					newRegionId, 
					{
						expires: 30,
						domain: `.vinsklad.ru`
					}
				);
			},
			setMainCity (state, newCity) {

				if (state.userCity.id != newCity.id){
					this.commit("deleteMainShop");
				}

				state.userCity = newCity;

				Cookies.set(
					"_userCity", 
					JSON.stringify(newCity), 
					{
						expires: 30,
						domain: `.vinsklad.ru`
					}
				);

			},
			setMainShop (state, id) {
				let shop = state.shopsData.filter(item => item.id == id)[0],
					cityId = shop.cityId,
					regionId = state.regionsData.cities.filter(item => item.id == cityId)[0].regionId;

				store.commit("setMainRegion", regionId);

				store.commit(
					"setMainCity", 
					state.regionsData
						.cities.filter(
							item => item.id == cityId
						)[0]
				);

				state.mainShop = shop;

				let tmpShop = {
					cityId: shop.cityId,
					id: shop.id,
					xml_id: shop.xml_id,
				};

				

				Cookies.set(
					"mainShop", 
					JSON.stringify(tmpShop), 
					{
						expires: 30,
						domain: `.vinsklad.ru`
					}
				);

				// location.reload()

				Cookies.set(
					"mainShopChanged",
					"1",
					{
						domain: `.vinsklad.ru`
					}
				)
				
				if (this.state.userCity.subdomain)
					window.location.host = `${this.state.userCity.subdomain}.vinsklad.ru`;
				else
					window.location.host = "vinsklad.ru"

			},
			loadData: async state =>{
				let response = await $.ajax({
					url: "/include/ajax.php",
					type: "POST",
					data: "AJAX_ADD_CITY=Y",
					success (response){
						return response
					}
				});

				let data = JSON.parse(response);

				if (state.userPosition)
					for (let i in data.shopsData){
						let shop = data.shopsData[i];

						if (isNaN(parseFloat(shop.lat)) || isNaN(parseFloat(shop.lng)))
							continue

						let distance = getDistanceFromLatLonInKm(parseFloat(state.userPosition.LAT), 
							parseFloat(state.userPosition.LNG),
							parseFloat(shop.lat),parseFloat(shop.lng))

						data.shopsData[i].distance = distance.toFixed(2);

						// shop.address = shop.address.replace("г. ", "").replace(" КО", "").replace(/\s+/g, " ");

					}

				data.shopsData.sort((a, b) => {
					var compA = a.address.toUpperCase();
					var compB = b.address.toUpperCase();

					return (compA < compB) ? -1 : (compA > compB) ? 1 : 0
				});

				state.regionsData = data.regionsData;

				state.shopsData = data.shopsData;

				if (localStorage){
        	try {
        		localStorage.setItem("regionsData", JSON.stringify(state.regionsData));
        		localStorage.setItem("regionsDataTimestamp", momentLast);

        		localStorage.setItem("shopsDataLast1", JSON.stringify(state.shopsData));
        		localStorage.setItem("shopsDataTimestamp", momentLast);
        	} catch (e){
        		console.log(e)
        	}
        }

        store.commit("checkLocation");
			},
			checkLocation(state){
				// if (!Cookies.get("age_confirmed"))
				// 	return;

				if (state.userRegionId == null){
					let findedRegion = state.regionsData.regions
					.filter(region => region.name == Cookies.getJSON("geolocation").REGION.replace("+", " "));

					if (findedRegion.length){
						state.userRegionId = findedRegion[0].id;
						window.app.$refs.citySelect.curRegion = +state.userRegionId;
					}
				}

				if (state.userCity == ""){
					let findedCity = state.regionsData.cities
					.filter(city => city.name == Cookies.getJSON("geolocation").CITY.replace("+", " "));

					if (findedCity.length){
						state.userCity = findedCity[0];
						setTimeout(() => {
							window.app.$refs.citySelect.curCity = +state.userCity.id;

							window.app.$refs.shops.isRegionSelected = state.userRegionId ? true : false;
							window.app.$refs.shops.isCitySelected = state.userCity ? true : false;
							// window.app.$refs.shops.curRegion = +state.userRegionId || "default";

							
							window.app.$refs.shops.setCity(state.userCity ? +state.userCity.id : "default", +state.userRegionId);

							// window.app.$refs.citySelect.curCity = +state.userCity.id;
						}, 100)

						state.showCityPopup = Cookies.get("cityPopupShowed") ? false : true;
						if (window.showShopPopup)
							app.showShopPopup(false);

						$(window).on("load", e => {
							$(".menu-mobile .city").html($("header .city").html());
						});

					}else{
						if (Cookies.get("age_confirmed"))
							app.showCityPopup(false)
						else
							app.showAgeConfirm()
					}
				}

				if (!Cookies.get("age_confirmed"))
					app.showAgeConfirm();
			},
		}
	});

	window.app = new Vue({
		el: "#page-wr",
		data: {
			headMessage: "",
			headMessageShow: false,
			headMessageClass: "notify",
			isShopsPopupOpened: false,
		},
		store: store,
		mounted () {
			console.log("mounted");

			// store.state.shopsData.sort((a, b) => {
			// 	let compA = a.address.toUpperCase(),
			// 		compB = b.address.toUpperCase();

			// 	return (compA < compB) ? -1 : (compA > compB) ? 1 : 0

			uploadInputmask();

			if (localStorage && (localStorage.shopsDataLast) || localStorage.shopsData){
				localStorage.removeItem("shopsDataLast");
				localStorage.removeItem("shopsData");
			}

			if (localStorage && (!store.state.regionsData.length || !store.state.shopsData.length))
				store.commit("loadData");
			else{
				if (!$(".app-block").length)
					this.showAgeConfirm()
			}

			loadScripts();

			//filter();

			// console.log(this.mainShop);

			// $('script:contains(CMenuOpener)').each((key, $script) => {
			// 	eval($script.innerText);
			// });
		},
		computed: {
			mainShop: () => store.state.mainShop,
			userCity: () => store.state.userCity,
			cityPopup: () => store.state.showCityPopup,
		},
		methods: {
			showAgeConfirm (){
				if ($(".app-block").length)
					return
				$.fancybox({
						href : '#age-forms',
						closeBtn : false,
						closeClick  : false,
						helpers     : {
						overlay : {
							closeClick: false,
						}
					},
					keys : {
						close : null,
					},
					beforeShow:function() {
						$('body').addClass('fancy-active');
					},
					afterShow:function(){

					},
					afterClose:function(){
						$('body').removeClass('fancy-active');
					},
				});
			},
			showMessage: async (text, options) => {

				if (app.headMessageShow){
					app.headMessageShow = false;
					await new Promise(resolve => {
						setTimeout(() => {
							resolve()
						}, 300)
					})
				}

				app.headMessage = "";
				app.headMessageClass = "notify";


				app.headMessageShow = true;

				app.headMessage = text;

				if (options.class)
					app.headMessageClass = options.class;

				setTimeout(()=>{
					app.headMessageShow = false;
				}, options.time || 2000)
				
			},
			setMainShop(id) {
				
			},
			hideCityPopup(){
				// Cookies.set("cityPopupShowed", 1);

				Cookies.set(
					"isUsercityConfirmed",
					{
						domain: `.vinsklad.ru`
					}
				);

				store.commit("setMainCity", this.userCity);

				store.state.showCityPopup = false;
			},
			getCurShopTime(){
				let time = [];
				if (store.state.mainShop != "" && store.state.mainShop.time != ""){
      		time = store.state.mainShop.time.split(" ");

      		time = time[1].split("-");
      	}else{
      		time[0] = "9:00";
      		time[1] = "22:00";
      	}

      	return time
			},
			showShopPopup(){
				if ($(".app-block").length)
					return

				let self = this;
				$("#menu-toggle").removeClass('open');
				$('body').removeClass("mobile-menu--open");

				Cookies.set(
					"isUsercityConfirmed",
					{
						domain: `.vinsklad.ru`
					}
				);

				$.fancybox({
					href: "#shops",
					beforeShow (){
						$("body").addClass("fancy-active");
						self.isShopsPopupOpened = true;
					},
					afterClose (){
						$("body").removeClass("fancy-active");
						self.isShopsPopupOpened = false;
					}
				})
			},
			showCityPopup(isClosable = true){
				if ($(".app-block").length)
					return

				$("#menu-toggle").removeClass('open');
				$('body').removeClass("mobile-menu--open");

				if (!isClosable)
					$.fancybox({
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
						beforeShow (){
							$("body").addClass("fancy-active")
						},
						afterClose (){
							$("body").removeClass("fancy-active")	
						},
						afterShow (){
							$.fancybox.update()
						}
					})
				else
					$.fancybox({
						href: "#city",
						beforeShow (){
							$("body").addClass("fancy-active")
						},
						afterClose (){
							$("body").removeClass("fancy-active")	
						},
						afterShow (){
							$.fancybox.update()
						}
					})
			}
		},
	});
}

Vue.component("datetime-pick", {
	props: {
		required: {
			type: Boolean,
			default: true
		}
	},
	data: () => ({
		dateTime: "",
	}),
	mounted(){
		$(".order-form__date").append('<div class="order-form__calendar">\
      <div id="order-calendar" class="calendar"></div>\
    </div>');


    $('.order-form__calendar').toggle();
	},
	methods: {
		openCalendar(){	
			var todayDate = moment();
      var ionStartDate = todayDate.format("DD.MM.YYYY");

      if(todayDate.hour() >= 22) {
          ionStartDate = todayDate.add(1, 'days').format("DD.MM.YYYY");
      }

      let curYear = +moment().format("YYYY"),
      		nextYear = curYear + 1;

      $('.order-form__calendar').toggle();

      $("#order-calendar").ionCalendar({
          lang: "ru",
          sundayFirst: false,
          years: curYear+"-"+nextYear,
          format: 'DD.MM.YYYY',
          hideArrows: true,
          startDate: ionStartDate,
          onClick: (date) => {
              window.cart_calendar_hours = $('.ic__time-select').val();

              var curDate = moment();
              curDate.locale("ru")
              curDate.minute(0);
              curDate.second(0);
              curDate.millisecond(0);

              var selectedDate = moment(date, 'DD.MM.YYYY');
              selectedDate.locale("ru")
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

              if ((selectedDate.diff(curDate, 'hours') < 2) || (selectedDate.diff(curDate, 'days') > 1)) {
              	// let text = "Заказ можно оформить только на сегодня и завтра c 9:00 до 22:00";
              	
              	let time = app.getCurShopTime();

              	let text = "Заказ можно оформить только на сегодня и завтра c "+time[0]+" до "+time[1];

            		app.showMessage(text, {
            			time: 2500,
            			class: "notify"
            		});
                // showHeaderMessage('', 'error');
                return false;
              }

              $('.order-form__calendar').toggle();
              this.dateTime = date;
          },
          onReady: (date) => {
              var selectedDate = moment(date, 'DD.MM.YYYY');
              var curDate = moment();

              if (typeof(window.cart_calendar_hours) != 'undefined') {
                  curDate.hour(window.cart_calendar_hours);
              }
              else {
                  curDate.add(1, 'hour');
              }
              var dt = moment();
              var html = '<div class="ic__time"><select class="ic__time-select">';

              let time = app.getCurShopTime();

              let timeStart = time[0], timeEnd = time[1];

              for(var i = +timeStart.split(":")[0]; i < +timeEnd.split(":")[0]; i++){
                  if((i < parseInt(moment().add(2, 'hour').format("H"))) && (selectedDate.format('DD') == moment().format('DD'))) {
                      continue;
                  }
                  if(i === parseInt(curDate.format("H"))){
                      html += '<option value="' + i + '" selected="selected">' + dt.hour(i).format("H") + ':00</option>';
                  } else {
                      html += '<option value="' + i + '">' + dt.hour(i).format("H") + ':00</option>';
                  }
              }
              html += '</select></div>';
              $('.ic__header').append(html);

              $('.ic__time-select').change((e) => {
                  var hour = $(e.currentTarget).val();
                  var date = this.dateTime;
                  if(date == "")
                      date = moment().format('HH:mm DD.MM.YYYY');
                  var selectedDate = moment(date, 'HH:mm DD.MM.YYYY');
                  selectedDate.hour(hour);
                  selectedDate.minute(0);
                  selectedDate.second(0);
                  this.dateTime = selectedDate.format('HH:mm DD.MM.YYYY');
              });
            }
        });
		}
	}
})

Vue.component("features", {
	props: {
		rows: {
			type: Array,
			default: []
		}
	},
	template: '\
		<div class="features">\
			<div class="features-list">\
				<div class="features-item" v-for="row in rows">\
					<div class="features-item__title">{{row.title}}</div>\
					<div class="features-item__content" v-html="row.content"></div>\
				</div>\
			</div>\
		</div>'
});

Vue.component("city-select", {
	data: () => ({
		curRegion: store.state.userRegionId || "default",
		curCity: (store.state.userCity != "" ? store.state.userCity.id : "default"),
		isRegionSelected: (store.state.userRegionId != null ? true : false),
		isCitySelected: (store.state.userCity != "" ? true : false),
	}),
	computed: {
		regionsList: () => store.state.regionsData.regions,
		citiesList () {
			return store.state.regionsData.cities.filter((item) => item.regionId == this.curRegion)
		},
	},
	mounted(){
		// store.commit("checkLocation");

		// this.curRegion = store.state.userRegionId || "default";
		// this.curCity = store.state.userCity != "" ? store.state.userCity.id : "default";
	},
	update() {
		$.fancybox.update();
	},
	watch: {
		curRegion(val, oldVal){
			this.isRegionSelected = true;
			this.curCity = "default";
		},
		curCity(val, oldVal){
			if (val == "default")
				this.isCitySelected = false;
			else
				this.isCitySelected = true;
		}
	},
	methods: {
		selectCity() {
			const targetCity = store.state.regionsData
			.cities.filter(item => item.id == this.curCity)[0];

			store.commit("setMainCity", targetCity);

			store.commit("setMainRegion", this.curRegion);
			app.showMessage("Город успешно выбран", {
				class: "notify",
				time: 2000
			});

			$.fancybox.close();

			//location.reload();
				
			if (targetCity.subdomain)
				window.location.host = `${targetCity.subdomain}.vinsklad.ru`;
			else
				window.location.host = "vinsklad.ru"
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
			default: false,
		}
	},
	data: () => ({
		search__input: "",
		isRegionSelected: Cookies.getJSON("userRegionId") ? true : false,
		isCitySelected: Cookies.getJSON("_userCity") ? true : false,
		viewType: Cookies.get("shopsViewType") || "dist",
		curRegion: +Cookies.getJSON("userRegionId") || "default",
		curCity: (Cookies.getJSON("_userCity") ? +Cookies.getJSON("_userCity").id : "default"),
		curShop: (Cookies.getJSON("mainShop") ? +Cookies.getJSON("mainShop").id : null),
		srollPane: null,
		map: null,
		mapId: "shops-map"+Math.random(),
		radioPrefix: Math.random(),
		isKart: window.ostatki ? true : false,
	}),
	watch: {
		search__input(val, oldVal){
			//this.scrollPane.reinitialise();
		},
		viewRadio(val, oldVal){
			if (val == oldVal)
				return

			
		},
		curRegion(val, oldVal){
			if (val == oldVal)
				return

			//store.commit("setMainRegion", val);

			this.isRegionSelected = true;
			this.isCitySelected = false;
			this.curCity = "default";
		},
		curCity(val, oldVal){
			if (val == oldVal || val == "default")
				return

			// console.log(this.viewType);

			if (this.viewType == "map"){
				// this.destroyMap();
				// console.log(this.viewType);
				// this.viewType = "map";
				this.reinitMap();
			}

			// console.log(this.viewType);

			//store.commit("setMainCity", (this.citiesList.filter((item) => item.id == this.curCity))[0]);

			//this.isCitySelected = true;
			this.update()
		},
		viewType (val, oldval) {
			switch (val){
				case "map":
					this.initMap();
				break;

				default:
					this.sort();
					//this.initScroll();
			}
		},
	},
	mounted (){
		// console.log(this.ostatki);

		// $(".shops-view__one:nth-child(2) label").trigger("click");

		// this.sort();

		if (this.isContacts)
			this.viewType = "map";

		// $(".shops-view__one:first-child label").trigger("click");

		// for (let i in this.filteredList)
			// console.log(this.filteredList[i].address);

		// this.initScroll();
		this.sort();

		//this.scrollPane.reinitialise();
	},
	updated () {
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
		initScroll(){
			// this.scrollPane = $(this.$el).find(".shops-list__list").jScrollPane();

			// this.scrollPane = this.scrollPane.data("jsp");

			// this.scrollPane.reinitialise();
		},
		destroyMap() {
			// console.log(this.map);
			// this.map.destructor();
		},
		reinitMap() {
			// this.map.removeAll();
			var coords = [], center = [0, 0], lat = 0, lng = 0;

			for (var i in this.shopsList){
				let shop = this.shopsList[i];

				if (!parseInt(this.ostatki[shop.xml_id]) && this.ostatki.length)
						continue

				if (!isNaN(parseFloat(shop.lat)) && !isNaN(parseFloat(shop.lat))){
					coords.push([parseFloat(shop.lat), parseFloat(shop.lng)]);
					lat += parseFloat(shop.lat);
					lng += parseFloat(shop.lng);
				}
			}

			let size = [$(this.$el).find(".shops__map").width(), $(this.$el).find(".shops__map").height()];

			let zoom = ymaps.util.bounds.getCenterAndZoom(ymaps.util.bounds.fromPoints(coords), size);

			// this.map.setZoom(zoom.zoom+0.4);

			this.map.setCenter(zoom.center, zoom.zoom);

			var objects = [], cluster = new ymaps.Clusterer({
					preset: 'islands#nightClusterIcons',
					clusterIconColor: "#e31e24",
					hasBalloon: false,
					gridSize: 80,
				}),
			selectedID = false;

			for (var i in this.shopsList){
				let shop = this.shopsList[i];

				if (!parseInt(this.ostatki[shop.xml_id]) && this.ostatki.length)
						continue

				if (isNaN(parseFloat(shop.lat)) || isNaN(parseFloat(shop.lat)))
					continue

				if (shop.id != store.state.mainShop.id)
					shop.balloonContent = '\
						<div class="shop-balloon">\
							<div class="shop-balloon__address">'+shop.address+'</div>\
							<div class="shop-balloon__time">'+shop.time+'</div>\
							<div v-if="shop.id != store.state.mainShop.id" class="shop-balloon__btn">\
								<span onclick="store.commit(\'setMainShop\', '+shop.id+')" class="btn btn--rectangle shop-select">Выбрать</span>\
							</div>\
						</div>\
					';
				else
					shop.balloonContent = '\
						<div class="shop-balloon">\
							<div class="shop-balloon__address">'+shop.address+'</div>\
							<div class="shop-balloon__time">'+shop.time+'</div>\
						</div>\
					';

				var placemark = new ymaps.Placemark(
					[parseFloat(shop.lat), parseFloat(shop.lng)],{
						balloonContent: shop.balloonContent,
					},{
						iconLayout: "default#image",
						iconImageHref: (shop.id != store.state.mainShop.id ? "/local/templates/vinsklad2017/img/ico-marker.png" : "/local/templates/vinsklad2017/img/ico-selected-marker.png"),
						iconImageSize: (shop.id != store.state.mainShop.id ? [32, 43] : [28, 33])
					}
				);

				if (shop.id == store.state.mainShop.id)
					selectedID = {
						coords: [parseFloat(shop.lat), parseFloat(shop.lng)]
					}

				objects.push(placemark);
			}

			cluster.add(objects);

			this.map.geoObjects.add(cluster);

			if (!selectedID){
				this.map.setBounds(cluster.getBounds(), {
	                checkZoomRange: true
	            })
	        }else
	        	this.map.setCenter(selectedID.coords, 3);

		},
		initMap () {
			var coords = [], center = [0, 0], lat = 0, lng = 0;

			$(".shops__map-map").html("");

			ymaps.ready(() => {

				for (var i in this.shopsList){
					let shop = this.shopsList[i];

					if (!parseInt(this.ostatki[shop.xml_id]) && this.ostatki.length)
						continue

					if (!isNaN(parseFloat(shop.lat)) && !isNaN(parseFloat(shop.lng))){
						coords.push([parseFloat(shop.lat), parseFloat(shop.lng)]);
						lat += parseFloat(shop.lat);
						lng += parseFloat(shop.lng);
					}
				}

				// center = [lng/coords.length, lat/coords.length];

				center = ymaps.util.bounds.getCenter(ymaps.util.bounds.fromPoints(coords));

				this.map = new ymaps.Map(this.mapId, {
					zoom: 11,
					center: center,
					// controls: ['fullscreenControl']
				});

				let size = [$(this.$el).find(".shops__map").width(), $(this.$el).find(".shops__map").height()];

				let zoom = ymaps.util.bounds.getCenterAndZoom(ymaps.util.bounds.fromPoints(coords), size);

				this.map.setZoom(zoom.zoom+0.4);

				var objects = [], cluster = new ymaps.Clusterer({
					preset: 'islands#nightClusterIcons',
					clusterIconColor: "#e31e24",
					hasBalloon: false,
					gridSize: 80,
				}),
				selectedID = false;

				for (var i in this.shopsList){
					let shop = this.shopsList[i];

					if (!parseInt(this.ostatki[shop.xml_id]) && this.ostatki.length)
						continue

					if (isNaN(parseFloat(shop.lat)) || isNaN(parseFloat(shop.lng)))
						continue

					if (shop.id != store.state.mainShop.id)
						shop.balloonContent = '\
							<div class="shop-balloon">\
								<div class="shop-balloon__address">'+shop.address+'</div>\
								<div class="shop-balloon__time">'+shop.time+'</div>\
								<div class="shop-balloon__btn">\
									<span onclick="store.commit(\'setMainShop\', '+shop.id+')" class="btn btn--rectangle shop-select">Выбрать</span>\
								</div>\
							</div>\
						'
					else
						shop.balloonContent = '\
							<div class="shop-balloon">\
								<div class="shop-balloon__address">'+shop.address+'</div>\
								<div class="shop-balloon__time">'+shop.time+'</div>\
							</div>\
						'

					var placemark = new ymaps.Placemark(
						[parseFloat(shop.lat), parseFloat(shop.lng)],{
							balloonContent: shop.balloonContent,
						},{
							iconLayout: "default#image",
							iconImageHref: (shop.id != store.state.mainShop.id ? "/local/templates/vinsklad2017/img/ico-marker.png" : "/local/templates/vinsklad2017/img/ico-selected-marker.png"),
							iconImageSize: (shop.id != store.state.mainShop.id ? [32, 43] : [28, 33])
						}
					);

					if (shop.id == store.state.mainShop.id)
						selectedID = {
							coords: [parseFloat(shop.lat), parseFloat(shop.lng)]
						}

					objects.push(placemark);
				}

				cluster.add(objects);

				this.map.geoObjects.add(cluster);

				if (!selectedID){
					this.map.setBounds(cluster.getBounds(), {
		                checkZoomRange: true
		            })
		        }else
		        	this.map.setCenter(selectedID.coords, 16);

				});

			
		},
		sort (){
			switch (this.viewType){
				case "alph":
					this.shopsList.sort((a, b) => {
						var compA = a.address.toUpperCase();
						var compB = b.address.toUpperCase();

						return (compA < compB) ? -1 : (compA > compB) ? 1 : 0
					});
				break;

				case "dist":
					this.shopsList.sort((a, b) => {
						return parseFloat(a.distance) - parseFloat(b.distance);
					});
				break;
			}

			// for (let i in this.filteredList){
			// 	let shop = this.filteredList[i];

			// 	console.log(shop.distance)
			// }
		},
		setViewMthod(method){
			if (method == "map"){

			}else{
				//this.initScroll();
			}
			//this.type = method;
		},
		setMainShop() {
			store.commit("setMainShop", this.curShop);
		},
		update() {
			this.isCitySelected = false;
			this.isCitySelected = true;
			this.sort();
		},
	},
	computed: {
		filteredList (){
			this.sort();

			return this.shopsList.filter(item => ~item.address.toLowerCase()
			.indexOf(this.search__input.toLowerCase()));
		},
		regionsList: () => store.state.regionsData.regions,
		citiesList () {
			return store.state.regionsData.cities.filter(item => item.regionId == this.curRegion)
		},
		shopsList () {
			if (!this.isKart)
				return store.state.shopsData.filter(item => item.cityId == this.curCity)
			else{

				return store.state.shopsData.filter(item => {
					console.log(item.cityId, this.curCity, store.state.inStock[item.xml_id], item.xml_id);

					return item.cityId == this.curCity && parseInt(this.ostatki[item.xml_id])
				})
			}
		},
		ostatki (){
			return store.state.inStock;
		},
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
	data: () => ({
		search__input: "",
		toggleText: "Развернуть",
	}),
	computed: {
		filteredItems (){
			return this.list.filter(item => {
				return ~item.name.toLowerCase().indexOf(this.search__input.toLowerCase())
			})
		}
	},
	methods: {
		toggleSearch() {
			this.toggleText = (this.toggleText == "Развернуть" ? "Свернуть" : "Развернуть");
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
			default: 10000,
		},
		min: {
			type: Number,
			default: 0,
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
	data: () => ({
		maxValue: 0,
		minValue: 0,
		$this: null,
		$range: null
	}),
	mounted (){
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
		maxValue (val, oldVal) {
			this.$range.slider("values", 1, val);
		},
		minValue (val, oldVal) {
			this.$range.slider("values", 0, val);
		}
	},
	methods: {
		initSlider () {
			var self = this;

			this.$range = this.$this.find(".range").slider({
				animate: "normal",
				min: +self.min,
				max: +self.max,
				values: [+self.minValue, +self.maxValue],
				range: true,
				step: +self.step,
				slide: (e, ui) =>{
					self.minValue = ui.values[0];
					self.maxValue = ui.values[1];
				}
			});
		}
	}
})

var log = (str) => {
	console.log(str)
},
loadScripts = () => {
	$(".fancybox").fancybox({
		beforeShow (){
			$("body").addClass("fancy-active")
		},
		afterClose (){
			$("body").removeClass("fancy-active")	
		}
	});

	$("body").on("click", ".mobile-head__top .head__shop-city", () => {
		app.showCityPopup();
	});

	$("body").on("click", ".mobile-head__top .head__shop-address .address", () => {
		app.showShopPopup();
	});

	$("body").on("click", ".mobile-head__top .head__shop-address .delete", () =>{
		store.commit("deleteMainShop");
		location.reload()
	});

	$(".main-slider").slick({
		slide: ".main-slider__slide",
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: true,
		speed: 400,
		autoplay: true,
		// lazyLoad: "progressive",
		autoplaySpeed: 4000
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

	$(".tabs__tab").click(function(){
		var $this = $(this);

		if ($(this).hasClass("active"))
			return

		var id = +$this.attr("data-id"),
			$parent = $this.closest(".tabs");

		$parent.find(".tabs__tab.active, .tabs-content.active").removeClass("active");

		$parent.find(".tabs__tab[data-id='"+id+"'], .tabs-content[data-id='"+id+"']").addClass("active");

	});

	$(".cat-slider").slick({
		slidesToShow: 4,
		slidesToScroll: 1,
		slide: ".cat-slider__slide",
		autoplay: true,
		autoplaySpeed: 3000,
		responsive: [
			{
				breakpoint: 1000,
				settings: {
					slidesToShow: 3,
				}
			},
			{
				breakpoint: 820,
				settings: {
					slidesToShow: 2,
				}
			},
			{
				breakpoint: 660,
				settings: {
					slidesToShow: 1,
				}
			}
		]
	});

	// слайдер в карточке товвара
	$(".another .cat-plate").slick({
		slidesToShow: 3,
		slidesToScroll: 1,
		slide: ".cat-plate__one-wrap",
		responsive: [
			{
				breakpoint: 820,
				settings: {
					slidesToShow: 2,
				}
			},
			{
				breakpoint: 660,
				settings: {
					slidesToShow: 1,
				}
			}
		]
	});

	$(".bot-text__btn").click(function(){
		$(this).toggleClass("active");
		$(this).parent(".bot-text").toggleClass("active");
	});

	$(".catalog-nav__current").click(function(){
		var $this = $(this);

		$this.next(".catalog-nav__list").slideToggle(300);
	});

	$('.catalog-filter__button').click(function(){
		var $this = $(this);

		$this.next('.catalog-filter__bock').slideToggle(300);
	});

	$(".filter-block__title").click(function(){
		var $this = $(this);

		$this.next(".filter-block__content").slideToggle(300);

		setTimeout(() =>{
			$this.parent(".filter-block").toggleClass("closed");
		}, 290);

	});

	$('.catalog__filter-btn').click(function() {
		$('.catalog-filter__bock').slideToggle('slow');
	});


	$(".price-filter").each((i, el)=>{
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
			slide: (e, ui) =>{
				$min.val(ui.values[0]);
				$max.val(ui.values[1]);
			},
			change(e, ui){
				smartFilter.reload($min[0])
			},
		});

		$this.find("input[type='tel']").on("keyup", function(){
			var id, val;

			if ($(this).attr("data-min")){
				id = 0;
				val = (+$(this).val() < min ? min : +$(this).val());
			}else if ($(this).attr("data-max")){
				id = 1;
				val = (+$(this).val() > max ? max : +$(this).val());
			}

			$range.slider("values", id, val);
		})
	});

	$('.tovar-slider').slick({
		slide: '.tovar-slider__slide',
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: false,

	});

	$('.vacancy__item-header').click(function() {
	 	$(this).next().slideToggle('slow');
	 	$(this).toggleClass('active');
	});

	$('#menu-toggle').click(function(){
		$(this).toggleClass('open');
		$('body').toggleClass("mobile-menu--open");
	});

	$('.catalog__filter-btn').click(function(){
		$(this).toggleClass('filter-open');
		$('catalog-nav').slideToggle('slow');
	});


	if($('body').hasClass('inner')) {
		$('.head__menu').each(function(i, el){
			let $this = $(this);

			var title = 'Каталог',
				catalogMenu = "";

			$this.find('.menu__link').each(function(){
				catalogMenu += '<li class="submenu__el">\
						<a href="'+$(this).attr("href")+'" class="submenu__link">'+$(this).text()+'</a>\
				</li>'
			});

			$(".mobile-menu").append('<li class="mobile-menu__el">\
	       		<span class="mobile-menu__link sub">'+title+'</span>\
	       		<ul class="submenu"><li class="submenu__el submenu__back">Назад</li>'+catalogMenu+'</ul>\
	       	</li>')

		});


	};



	$(".footer-menu__cont").each((i, el) =>{
    let $this = $(el);

    var title = $this.find(".footer-menu__title").text(),
   		submenu = "";

   	$this.find(".footer-menu__link").each((i, el) =>{
   		let $this = $(el);

      submenu += '<li class="submenu__el">\
			<a href="'+$this.attr("href")+'" class="submenu__link">'+$this.text()+'</a>\
		</li>'
   	});


   	$(".mobile-menu").append('<li class="mobile-menu__el">\
   		<span class="mobile-menu__link sub">'+title+'</span>\
   		<ul class="submenu"><li class="submenu__el submenu__back">Назад</li>'+submenu+'</ul>\
   	</li>')

	});

  $('.catalog-nav').each((i, el) =>{
  	let $this = $(el);

  	var title = 'Категории',
  	categoryList = "";

  	$this.find('.catalog-nav__list-link').each((i, el) => {
  		let $this = $(el);

  		categoryList += '<li class="submenu__el">\
				<a href="'+$this.attr("href")+'" class="submenu__link">'+$this.text()+'</a>\
			</li>'
  	});

  	$(".mobile-menu").append('<li class="mobile-menu__el">\
       		<span class="mobile-menu__link sub">'+title+'</span>\
       		<ul class="submenu"><li class="submenu__el submenu__back">Назад</li>'+categoryList+'</ul>\
       	</li>')

  });

	$('.head__top').clone().addClass("mobile-head__top").appendTo('.menu-mobile__wrap');
	$('.msgs').clone().removeClass("msgs").addClass("mobile-menu__message").appendTo('.menu-mobile__wrap');

	if($(window).width() < 820) {

		var fooerSoc = $('.footer__soc .soc').clone().removeClass('soc').addClass('js__mobile-soc');
		$('.mobile-menu__message').prepend(fooerSoc);
	};
	

	$("body").on("click", ".mobile-menu__link.sub, .submenu__back", function(){
		let $this = $(this);

		$this.closest('.mobile-menu__el').toggleClass('submenu-open');

	});

	$(".to-full").click(e =>{
		Cookies.set("full-version", 1);
		location.reload();
	});

	$(".to-mobile").click(e => {
		Cookies.remove("full-version");
		location.reload();
	});

	$('input[type="file"]').change(function(){
		var value = $(this)[0].files[0].name;
		$(this).prev('.forms__input--file-support').val(value);
		$(this).next('.forms__input--file-support').val(value);
	});


	if ($("html").hasClass("bx-ie")){
		$(".main-news__important").css({
			height: "auto"
		});
		$(".main-news").css({
			"min-height": $(".main-news__important").height()
		});
	}

	$(".main-slider__slide").each((i, el) => {
		let $this = $(el);

		if ($this.find(".main-slider__slide-title").text() == "")
			$this.addClass("js__empty");
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
	    mouseEvent.initMouseEvent(
	        simulatedEvent, //type
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


	
}

var getDistanceFromLatLonInKm = (lat1,lon1,lat2,lon2) => {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
},
deg2rad = (deg) => {
  return deg * (Math.PI/180)
}



document.addEventListener("DOMContentLoaded", function(){
	if (!document.body.classList.contains("mobile-app") && !is.ios())
		$.smartbanner({
			title: "Винный склад",
			appStoreLanguage: "ru",
			button: "Установить",
			price: "",
			icon: "/local/templates/vinsklad2017/img/app-icon.jpg",
		});

	;(function () {
		const iosApp = "https://apps.apple.com/ru/app/винный-склад/id1450252717",
			androidApp = "https://play.google.com/store/apps/details?id=us.startmobile.vinestore&hl=ru",
			appLink = document.querySelector(".app-wrapper");

		if (!appLink)
			return;

		if (is.ios())
			appLink.setAttribute("href", iosApp)
		else
			appLink.setAttribute("href", androidApp)
	})()
})