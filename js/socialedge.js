$(document).ready(function () {
    function createCookie(name, value, days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            var expires = "; expires=" + date.toGMTString();
        }
        else var expires = "";
        document.cookie = name + "=" + value + expires + "; path=/";
    }

    function readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    function eraseCookie(name) {
        createCookie(name, "", -1);
    }

    function hideSplash() {
        var $splash = $("div.splash-screen");

        $splash.addClass('unvisible');
        $splash.one('transitionend', function () {
            setTimeout(function () {
                $splash.hide();
            }, 20);
        });
    }

    function showSplash() {
        var $splash = $("div.splash-screen");
        $splash.show();
        $splash.removeClass('unvisible');
    }

    function translate(lang, callback) {
        var _path = 'i18n/' + lang + '.json';

        var _load = {};
        _load[lang] = _path;
        $.i18n().load(_load).done(function () {
            $.i18n().locale = lang;

            $("*[data-i18n]").each(function () {
                var $curr = $(this);
                var transl = $.i18n($curr.attr("data-i18n"));
                if ($curr.is('[placeholder]')) {
                    $curr.attr("placeholder", transl);
                    $curr.val('');
                } else {
                    $curr.html($.i18n(transl));
                }

                if (typeof callback === "function") {
                    callback();
                }
            });
        });
    }

    function detectCountryCode(callback) {
        var fallbackCountryCode = "gb";

        $.ajax({
            url: 'http://ip-api.com/json',
            timeout: 2500,
            dataType: "jsonp"
        }).done(function(data) {
            var browserCountry = data.countryCode.toLowerCase();
            if (typeof callback === "function")
                callback(browserCountry);
        }).fail(function() {
            if (typeof callback === "function")
                callback(fallbackCountryCode);
        });
    }

    function detectAvailableLanguages() {
        var availableLanguages = {};

        $(".lang-panel .lang-code").each(function () {
            var _lang = $(this).attr("data-lang");
            var _countries = $(this).attr("data-country");
            if (_countries.indexOf(',') > -1) {
                _countries = _countries.split(',');
            } else {
                _countries = [_countries];
            }

            for (var i = 0; i < _countries.length; i++) {
                var country = _countries[i];
                availableLanguages[country] = _lang;
            }
        });

        return availableLanguages;
    }

    $(window).load(function () {
        var _$navToggle = $(".navbar-toggle");
        $('.nav a:not(.dropdown-toggle)').on('click', function(){
            if (_$navToggle.css('display') != 'none') {
                _$navToggle.click();
            }
        });

        var defaultLanguage = "en";
        console.log("i18n: Default language: " + defaultLanguage);

        var availableLanguages = detectAvailableLanguages();
        console.log("i18n: Available languages {country: language, ...}: ", availableLanguages);

        var cookieLang = readCookie("lang");
        if (cookieLang) {
            console.log("i18n: Language loaded from cookie: " + cookieLang);

            translate(cookieLang, function () {
                hideSplash();
            });
        } else {
            detectCountryCode(function(country){
                console.log("i18n: Browser country: " + country);

                var selectedLanguage = availableLanguages[country] ? availableLanguages[country] : defaultLanguage;
                console.log("i18n: Selected language: " + selectedLanguage);

                translate(selectedLanguage, function () {
                    hideSplash();
                });
            });
        }

        $(".lang-panel .lang-code").each(function () {
            var _lang = $(this).attr("data-lang");
            $(this).click(function () {
                showSplash();
                translate(_lang, function() {
                    eraseCookie("lang");
                    createCookie("lang", _lang, 25);
                    hideSplash();
                });
            });
        });

        var _$contactForm = $("form#contact-form");
        var _$contactFormSubmit = _$contactForm.find('[type="submit"]');
        var _$contactFormHourglass = _$contactForm.find('.glyphicon-hourglass');
        var _$contactFormOk = _$contactForm.find('.glyphicon-ok');

        _$contactForm.submit(function (e) {
            e.preventDefault();
            _$contactFormSubmit.prop('disabled', true);
            _$contactFormHourglass.css('visibility', 'visible');
            var name = $("input#contact-name").val();
            var email = $("input#contact-email").val();
            var tel = $("input#contact-mobile").val();
            var subject = $("input#contact-subject").val();
            var body = $("textarea#contact-body").val();

            emailjs.send("gmail", "contact_us_form",
                {"topic": subject, "body": body, "name": name, "phone": tel, "email": email})
            .then(function(response) {
                console.log("EmailJS OK! status=%d, text=%s", response.status, response.text);
                _$contactForm.trigger("reset");
                _$contactFormSubmit.prop('disabled', true);
                _$contactFormHourglass.css('visibility', 'hidden');
                _$contactFormOk.css('visibility', 'visible');
                setTimeout(function () {
                    _$contactFormOk.css('visibility', 'hidden');
                }, 5000);
            }, function(err) {
                console.log("EmailJS Error = ", err);
                _$contactFormHourglass.css('visibility', 'hidden');
            });
        });
    });
});