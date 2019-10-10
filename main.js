// 參考資料

// DFT
// https://blog.csdn.net/sac761/article/details/76525188?fbclid=IwAR3S5ForwXvr3N2Cb44iRz6naGqq1KiwM2GXCBMd4kDqLaG3ej3hGKm-H6I

// FFT原理
// https://ccjou.wordpress.com/2012/05/25/%E5%BF%AB%E9%80%9F%E5%82%85%E7%AB%8B%E8%91%89%E8%BD%89%E6%8F%9B/?fbclid=IwAR0cKxfMMt9AZYsKBqt60Ko1ojiO5_jnoqW1Tqt8TIl3U1N3NBzGK4-tpe0

// FFT蝴蝶算法
// https://developer.nvidia.com/sites/all/modules/custom/gpugems/books/GPUGems2/elementLinks/48_fft_01.jpg?fbclid=IwAR2H-0eU76Zdzrvrn_MPJDliacIK6MSIuLEh060NvqEWKjb1Zxnvb2el7mQ

// 二維FFT to 2個一維FFT
// https://zhuanlan.zhihu.com/p/36377799?fbclid=IwAR3NN4Bjy3aZtE1d8VANJM0gown7Cc_XQPH6SxrlZkjmXV4cZsWNErwOdq0


function str_reverse(str) {
    return str.split("").reverse().join("");
}

function zero_str(count) {
    var a = new Array(count);
    return a.fill(0).join("");
};

function bit_reverse(value, bit_length) {
    var bit_str = value.toString(2);

    //補0
    if (bit_str.length != bit_length) {
        var zero_count = bit_length - bit_str.length;
        bit_str = zero_str(zero_count) + bit_str;
    }

    var bit_str_reverse = str_reverse(bit_str);
    return parseInt(bit_str_reverse, 2);
}

// 蝴蝶算法的第1步
function set_element_order_per_column(src, des, n) {
    var number = Math.pow(2, n);
    for (var x = 0; x < number; ++x) {
        for (var y = 0; y < number; ++y) {
            des[x][y] = src[x][bit_reverse(y, n)];
            //console.log(y, bit_reverse(y, n));
        }
    }
}

function multiply(m_factor, src, des, number) {
    for (var x = 0; x < number; ++x) {
        for (var y = 0; y < number; ++y) {
            des[x][y] = m_factor[y] * src[x][y];
        }
    }
}

function add_or_minus(src, des, x, number) {
    var offset = Math.pow(2, x);
    console.log(offset);
    for (var x = 0; x < number; ++x) {
        for (var y = 0; y < number; ++y) {
            if (Math.floor(y / offset) % 2 == 0)
                des[x][y] = src[x][y] + src[x][y + offset];
            else
                des[x][y] = src[x][y - offset] - src[x][y];
        }
    }
}

function test_add_or_minus() {
    var b1 = new Array(8);
    for (var x = 0; x < 8; ++x) {
        b1[x] = new Array(8);
        for (var y = 0; y < 8; ++y)
            b1[x][y] = y;
    }
    var b2 = new Array(8);
    for (var x = 0; x < 8; ++x)
        b2[x] = new Array(8).fill(0);


    add_or_minus(b1, b2, 0, 8);
    console.log(b1);
    console.log(b2);
}

window.onload = () => {
    var img = document.getElementsByTagName("img")[0];
    var w = img.width;
    var h = img.height;

    // fill source
    source.width = w;
    source.height = h;
    var source_ctx = source.getContext("2d");
    source_ctx.drawImage(img, 0, 0, w, h);

    // hold source data array
    var source_data = source_ctx.getImageData(0, 0, w, h);
    var source_data_array = source_data.data;

    // hold canvas data array
    canvas.width = w;
    canvas.height = h;
    var draw_ctx = canvas.getContext("2d");
    var canvas_data = draw_ctx.getImageData(0, 0, w, h);
    var canvas_data_array = canvas_data.data;

    // init buffer
    var buffer1 = new Array(w);
    for (var x = 0; x < h; ++x)
        buffer1[x] = new Array(h).fill(0);
    var buffer2 = new Array(w);
    for (var x = 0; x < h; ++x)
        buffer2[x] = new Array(h).fill(0);

    // https://stackoverflow.com/questions/46863683/speed-up-canvass-getimagedata
    // copy from source to buffer1
    for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x) {
            var index = 4 * (x + y * w);
            var value = source_data_array[index];
            buffer1[x][y] = value;
        }
    }

    var n = 9;
    var number = Math.pow(2, n);
    // 蝴蝶算法的第1步:交換位置
    // set_element_order_per_column(buffer1, buffer2, 9);
    // [buffer1, buffer2] = [buffer2, buffer1];

    var m = new Array(512).fill(1.25);
    // multiply(m, buffer1, buffer2, number);
    // [buffer1, buffer2] = [buffer2, buffer1];

    add_or_minus(buffer1, buffer2, 0, number);
    [buffer1, buffer2] = [buffer2, buffer1];


    // console.log(buffer1);
    // console.log(buffer2);


    // copy from buffer to canvas
    for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x) {
            var index = 4 * (x + y * w);
            var value = buffer1[x][y];
            canvas_data_array[index++] = value;
            canvas_data_array[index++] = value;
            canvas_data_array[index++] = value;
            canvas_data_array[index] = 255;
        }
    }
    draw_ctx.putImageData(canvas_data, 0, 0);
    console.log("finish");

    test_add_or_minus();

};