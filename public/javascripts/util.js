export default {
    $(str) {
        return document.querySelector(str);
    },

    $$(str) {
        return document.querySelectorAll(str);
    },

    $c(tagName, obj) {
        let e = document.createElement(tagName);
        Object.assign(e, obj);
        return e;
    },

    timeformat(nums) {
        let d = new Date(nums);
        let m = d.getMonth() + 1;
        let day = d.getDate();
        let h = d.getHours();
        let mi = d.getMinutes();
        let s = d.getSeconds();
        m = m > 9 ? m : '0' + m;
        day = day > 9 ? day : '0' + day;
        h = h > 9 ? h : '0' + h;
        mi = mi > 9 ? mi : '0' + mi;
        s = s > 9 ? s : '0' + s;

        return m + '-' + day + ' ' + h + ':' + mi + ':' + s;
    },

}