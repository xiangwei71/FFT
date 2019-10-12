// 參考資料

// DFT
// https://blog.csdn.net/sac761/article/details/76525188?fbclid=IwAR3S5ForwXvr3N2Cb44iRz6naGqq1KiwM2GXCBMd4kDqLaG3ej3hGKm-H6I

// FFT原理
// https://ccjou.wordpress.com/2012/05/25/%E5%BF%AB%E9%80%9F%E5%82%85%E7%AB%8B%E8%91%89%E8%BD%89%E6%8F%9B/?fbclid=IwAR0cKxfMMt9AZYsKBqt60Ko1ojiO5_jnoqW1Tqt8TIl3U1N3NBzGK4-tpe0

// FFT蝴蝶算法
// https://developer.nvidia.com/sites/all/modules/custom/gpugems/books/GPUGems2/elementLinks/48_fft_01.jpg?fbclid=IwAR2H-0eU76Zdzrvrn_MPJDliacIK6MSIuLEh060NvqEWKjb1Zxnvb2el7mQ

// 二維FFT to 2個一維FFT
// https://zhuanlan.zhihu.com/p/36377799?fbclid=IwAR3NN4Bjy3aZtE1d8VANJM0gown7Cc_XQPH6SxrlZkjmXV4cZsWNErwOdq0

function Complex(x, y) {
    this.x = x; // real
    this.y = y; // image

    this.add = (c, result) => {
        result.x = this.x + c.x;
        result.y = this.y + c.y;
    }

    this.minus = (c, result) => {
        result.x = this.x - c.x;
        result.y = this.y - c.y;
    }

    this.multiply = (c, result) => {
        var x = this.x;
        var y = this.y;
        var a = c.x;
        var b = c.y;
        result.x = a * x - b * y;
        result.y = a * y + b * x;
    }

    this.rewrite = (c) => {
        this.x = c.x;
        this.y = c.y;
    }
}

/**
 *                               power
 * @param {*} power     \  /\  /
 * @param {*} N          \/  \/  N
 */
function W(power, N) {
    var theda = power * 2 * Math.PI / N;
    return new Complex(Math.cos(theda), Math.sin(theda));
}


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
/**
 * 
 * @param {*} src 
 * @param {*} des 
 * @param {*} h row count
 */
function set_element_order_per_column(src, des, h) {
    var n = Math.log2(h);
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            var c = src[x][bit_reverse(y, n)];
            des[x][y].rewrite(c);
            //console.log(y, bit_reverse(y, n));
        }
    }
}

/**
 * 
 * @param {*} weights 
 * @param {*} src 
 * @param {*} des 
 * @param {*} h row count
 */
function multiply(weights, src, des, h) {
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            src[x][y].multiply(weights[y], des[x][y]);
        }
    }
}

/**
 * 
 * @param {*} src 
 * @param {*} des 
 * @param {*} x 2^n= h ,x < n
 * @param {*} h 
 */
function add_or_minus(src, des, x, h) {
    var offset = Math.pow(2, x);
    console.log(offset);
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y) {
            if (Math.floor(y / offset) % 2 == 0)
                src[x][y].add(src[x][y + offset], des[x][y]);
            else
                src[x][y - offset].minus(src[x][y], des[x][y]);
        }
    }
}

/**
 * 
 * @param {*} N 2^n= N
 * @param {*} order 1~(n-1)
 */
function build_weights(N, order) {

    var n = Math.log2(N);
    var w_offset = Math.pow(2, n - 1 - order);
    var repeat = w_offset;

    var count = Math.pow(2, order);
    var weights_subset = new Array(count).fill(new Complex(1, 0));// 複數的單位元是1+0i

    for (var i = 0; i < count; ++i) {
        weights_subset.push(new W(i * w_offset, N));
        // weights_subset.push("W_" + i * w_offset + "_" + N);
    }

    var weights = new Array();
    for (var i = 0; i < repeat; ++i)
        weights = weights.concat(weights_subset);

    return weights;
}

function butterfly(buffer1, buffer2, h) {
    // 蝴蝶算法的第1步:交換位置
    set_element_order_per_column(buffer1, buffer2, h);
    [buffer1, buffer2] = [buffer2, buffer1];

    var N = h;
    var n = Math.log2(N);
    for (var order = 0; order < n - 1; ++order) {
        add_or_minus(buffer1, buffer2, order, h);
        [buffer1, buffer2] = [buffer2, buffer1];

        var weights = build_weights(N, order + 1);
        // console.log(weights);
        multiply(weights, buffer1, buffer2, h);
        [buffer1, buffer2] = [buffer2, buffer1];
    }

    add_or_minus(buffer1, buffer2, n - 1, h);
    [buffer1, buffer2] = [buffer2, buffer1];

    return [buffer1, buffer2];
}

function transpose(src, des, h) {
    for (var x = 0; x < h; ++x) {
        for (var y = 0; y < h; ++y)
            des[x][y].rewrite(src[y][x]);
    }

    return [des, src];
}

function test_add_or_minus() {
    var b1 = creat_buffer(8, 8);
    var b2 = creat_buffer(8, 8);

    for (var x = 0; x < 8; ++x) {
        for (var y = 0; y < 8; ++y)
            b1[x][y] = new Complex(y, y);
    }

    add_or_minus(b1, b2, 0, 8);
    console.log(b1);
    console.log(b2);
}

function creat_buffer(w, h) {
    var buffer = new Array(w);
    for (var x = 0; x < w; ++x) {
        buffer[x] = new Array(h);

        for (var y = 0; y < h; ++y)
            buffer[x][y] = new Complex(0, 0);
    }
    return buffer;
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
    var buffer1 = creat_buffer(w, h);
    var buffer2 = creat_buffer(w, h);

    // https://stackoverflow.com/questions/46863683/speed-up-canvass-getimagedata
    // copy from source to buffer1
    for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x) {
            var index = 4 * (x + y * w);
            var value = source_data_array[index];
            buffer1[x][y].x = value;
        }
    }

    /*二維DFT可以分解成 2次一維DFT
    B=MX
    Y=M(B)T
    */

    // B=MX
    [buffer1, buffer2] = butterfly(buffer1, buffer2, h);

    // (B)T
    [buffer1, buffer2] = transpose(buffer1, buffer2, h);

    // Y=M(B)T
    [buffer1, buffer2] = butterfly(buffer1, buffer2, h);

    // var m = new Array(h).fill(new Complex(1.25, 0));
    // multiply(m, buffer1, buffer2, h);
    // [buffer1, buffer2] = [buffer2, buffer1];

    // add_or_minus(buffer1, buffer2, 0, h);
    // [buffer1, buffer2] = [buffer2, buffer1];


    // console.log(buffer1);
    // console.log(buffer2);


    // copy from buffer to canvas
    for (var y = 0; y < h; ++y) {
        for (var x = 0; x < w; ++x) {
            var index = 4 * (x + y * w);
            //顯示實數和虛數部
            canvas_data_array[index++] = buffer1[x][y].x;
            canvas_data_array[index++] = buffer1[x][y].y;
            canvas_data_array[index++] = 0;
            canvas_data_array[index] = 255;
        }
    }
    draw_ctx.putImageData(canvas_data, 0, 0);
    console.log("finish");

    // test add_or_minus()
    // test_add_or_minus();

    // test code
    // var c = new Complex(1, 2);
    // var c2 = new Complex(2, 4);
    // var c3 = new Complex(0, 0);
    // c.multiply(c2, c3);
    // console.log(c3);

    // test W
    // var N = 16;
    // for (var i = 0; i < N + 1; ++i) {
    //     console.log(new W(i, N));
    // }

    // var weights = build_weights(16, 1);
    // console.log(weights);
};