$(() => {
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
})