# FFT
play FFT

# 參考資料

## DFT
[原文](https://blog.csdn.net/sac761/article/details/76525188?fbclid=IwAR3S5ForwXvr3N2Cb44iRz6naGqq1KiwM2GXCBMd4kDqLaG3ej3hGKm-H6I)  

## Shift
[原文](https://blog.csdn.net/haoaoweitt/article/details/83012477)

## FFT原理
[原文](https://ccjou.wordpress.com/2012/05/25/%E5%BF%AB%E9%80%9F%E5%82%85%E7%AB%8B%E8%91%89%E8%BD%89%E6%8F%9B/?fbclid=IwAR0cKxfMMt9AZYsKBqt60Ko1ojiO5_jnoqW1Tqt8TIl3U1N3NBzGK4-tpe0)  

## FFT蝴蝶算法
[圖片From Nvidia](https://developer.nvidia.com/sites/all/modules/custom/gpugems/books/GPUGems2/elementLinks/48_fft_01.jpg?fbclid=IwAR2H-0eU76Zdzrvrn_MPJDliacIK6MSIuLEh060NvqEWKjb1Zxnvb2el7mQ)  

```
function butterfly(buffer1, buffer2, h, is_inverse) {
    // 蝴蝶算法的第1步:交換位置
    set_element_order_per_column(buffer1, buffer2, h);
    [buffer1, buffer2] = [buffer2, buffer1];

    var N = h;
    var n = Math.log2(N);
    for (var order = 0; order < n - 1; ++order) {
        add_or_minus(buffer1, buffer2, order, h);
        [buffer1, buffer2] = [buffer2, buffer1];

        var weights = build_weights(N, order + 1, is_inverse);
        multiply(weights, buffer1, buffer2, h);
        [buffer1, buffer2] = [buffer2, buffer1];
    }

    add_or_minus(buffer1, buffer2, n - 1, h);
    [buffer1, buffer2] = [buffer2, buffer1];

    return [buffer1, buffer2];
}
```

## 二維DFT可以分解成 2次一維DFT
[原文](https://zhuanlan.zhihu.com/p/36377799?fbclid=IwAR3NN4Bjy3aZtE1d8VANJM0gown7Cc_XQPH6SxrlZkjmXV4cZsWNErwOdq0)

```
function FFT(buffer1, buffer2, h) {
    /*二維DFT可以分解成 2次一維DFT
    B=MX
    Y=M Transpose(B)
    */

    [buffer1, buffer2] = butterfly(buffer1, buffer2, h, false);
    [buffer1, buffer2] = transpose(buffer1, buffer2, h);
    [buffer1, buffer2] = butterfly(buffer1, buffer2, h, false);

    return [buffer1, buffer2];
}
```
