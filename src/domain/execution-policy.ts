import type {Language} from '../schema.js'

// Dockerコンテナのリソース制限を定義するためのインターフェース
interface ResourceLimits {
    memoryMb: number;
    cpus: number;
    pidsLimit: number;
    timeoutSec: number;
}

// 言語ごとの実行ポリシーを定義するクラス
class ExecutionPolicy {
    // 言語ごとのリソース制限を取得するための静的メソッド
    static limitsFor(language: Language): ResourceLimits {
        switch(language){
            case 'node':
            case 'python':
                return {memoryMb: 256, cpus: 0.5, pidsLimit: 64, timeoutSec: 5};
            case 'cpp':
                return {memoryMb: 128, cpus: 1, pidsLimit: 32, timeoutSec: 3};
        }
    }

    // Dockerイメージ名を取得するための静的メソッド
    static imageFor(language: Language): string{
        return `runner-${language}:latest`;
    }

    static entrypointFor(language: Language): string[]{
        switch(language){
            case 'node':
                return ['node', '/sandbox/code.js'];
            case 'python':
                return ['python', '/sandbox/code.py'];
            case 'cpp':
                //cppはコンパイル段階が先に必要であるため、別途スクリプトに委任すると仮定
                return ['/sandbox/run.sh'];
        }
    }
}

export {ExecutionPolicy, type ResourceLimits};