/**
 * Created by Administrator on 2015/11/19.
 */
require.config({
    waitSeconds: 0,
    paths: {
        "jquery": "../bower_components/jquery/dist/jquery.min",
        "select1": "../js/select1",
        "selectOld": "../js/oldSelect",
        "lex": "../js/lex"
    },
    shim: {
        'lex': ['jquery']
    }
});
