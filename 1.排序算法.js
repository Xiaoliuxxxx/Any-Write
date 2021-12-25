/*jshint esversion: 6 */

const arr = [3, 44, 38, 5, 47, 15, 36, 6, 27, 23, 46, 4, 19, 50, 48];
/**
 * 1.冒泡排序
 * 稳定
 * 时间复杂度O(N2)
 */

function bubbleSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr.length - i; j++) {
      if (arr[j] > arr[j + 1]) {
        // 交换数据
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}

// console.log(bubbleSort(arr));

function bubbleSort2(arr) {
  let i = arr.length;
  while (i > 0) {
    let pos = 0;
    for (let j = 0; j < i; j++) {
      if (arr[j] > arr[j + 1]) {
        pos = j;
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
    i = pos;
  }
  return arr;
}

// console.log(bubbleSort2(arr));

/**
 * 2.快速排序
 * 不稳定
 * 时间复杂度O(nlogn)
 */

function qSort(arr, left = 0, right = arr.length - 1) {
  if (left < right) {
    let index = partition(arr, left, right);
    qSort(arr, left, index - 1);
    qSort(arr, index + 1, right);
  }
  return arr;
}
function swap(arr, i, j) {
  let temp = arr[i];
  arr[i] = arr[j];
  arr[j] = temp;
}

function partition(arr, left, right) {
  let index = left;
  for (let i = left + 1; i <= right; i++) {
    if (arr[i] < arr[left]) {
      index++;
      swap(arr, index, i);
    }
  }
  swap(arr, left, index);
  return index;
}

// console.log(qSort(arr));

/**
 * 3.选择排序
 */

function selectSort(arr) {
  for (let i = 0; i < arr.length; i++) {
    let minIndex = i;
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[j] < arr[minIndex]) {
        minIndex = j;
      }
    }
    swap(arr, minIndex, i);
  }
  return arr;
}

// console.log(selectSort(arr));

/**
 * 4.插入排序
 *
 */

function insertSort(arr) {
  for (let i = 1; i < arr.length; i++) {
    let value = arr[i];
    let j = i - 1;
    while (j >= 0 && arr[j] > value) {
      arr[j + 1] = arr[j];
      j--;
    }
    arr[j + 1] = value;
  }
  return arr;
}

console.log(insertSort(arr));
