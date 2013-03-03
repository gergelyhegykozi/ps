!function($) {
    asyncTest( "Check iframe rendering", function() {
        $('#test').on('ps:render', function(e) {
            var $target = $(e.target);
            ok($target.hasClass('active'), 'Active class added');
            ok($target.hasClass('slide-down'), 'Animation class added');
            ok($('iframe[name=' + e.target.id + ']').length === 1, 'Iframe rendered');
            start();
        });
    });
}(jQuery);
