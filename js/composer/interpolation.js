

class BaseInterpolator {
    constructor(x, m) {
        this.n = x.length;
        this.mm = m;
        this.jsav = 0;
        this.cor = 0;
        this.dj = Math.min(1, Math.floor(Math.pow(this.n, 0.25)));
        this.xx = x;
    }

    interpolate(x) {
        const jlo = (this.cor != 0) ? this.hunt(x) : this.locate(x);
        return this.rawInterpolate(jlo, x);
    }

    rawInterpolate(jlo, x) {
        return 0.0;
    }

    //    public double interpolate(double x) {
    //        int jlo = (cor != 0) ? hunt(x) : locate(x);
    //        return rawInterpolate(jlo, x);
    //    }
    //
    //    public void interpolate(double x, double[] input, double[] result) {
    //        int jlo = (cor != 0) ? hunt(x) : locate(x);
    //        rawInterpolate(jlo, x, input, result);
    //    }
    //
    //    public double interpolate(double x, double[] input) {
    //        int jlo = (cor != 0) ? hunt(x) : locate(x);
    //        return rawInterpolate(jlo, x, input);
    //    }

    locate(x) {
        let ju, jm, jl;
        if (this.n < 2 || this.mm < 2 || this.mm > this.n) {
            logit("Locate size error");
            return 0;
        }
        const ascnd = (this.xx[this.n - 1] >= this.xx[0]);
        jl = 0;
        ju = this.n - 1;
        while (ju - jl > 1) {
            jm = (ju + jl) >> 1;
            if (x >= this.xx[jm] == ascnd) {
                jl = jm;
            } else {
                ju = jm;
            }
        }
        this.cor = Math.abs(jl - this.jsav) > this.dj ? 0 : 1;
        this.jsav = jl;
        return Math.max(0, Math.min(this.n - this.mm, jl - ((this.mm - 2) >> 1)));
    }

    hunt(x) {
        let jl = this.jsav;
        let jm, ju;
        let inc = 1;
        if (this.n < 2 || this.mm < 2 || this.mm > this.n) {
            logit(" Hunt size error");
            return 0;
        }
        const ascnd = (this.xx[this.n - 1] > this.xx[0]);
        if (jl < 0 || jl > this.n - 1) {
            jl = 0;
            ju = this.n - 1;
        } else {
            if (x >= this.xx[jl] == ascnd) {
                for (;;) {
                    ju = jl + inc;
                    if (ju >= this.n - 1) {
                        ju = this.n - 1;
                        break;
                    } else if (x < this.xx[ju] == ascnd) {
                        break;
                    } else {
                        jl = ju;
                        inc += inc;
                    }
                }
            } else {
                ju = jl;
                for (;;) {
                    jl = jl - inc;
                    if (jl <= 0) {
                        jl = 0;
                        break;
                    } else if (x >= this.xx[jl] == ascnd) {
                        break;
                    } else {
                        ju = jl;
                        inc += inc;
                    }
                }
            }
        }
        while (ju - jl > 1) {
            jm = (ju + jl) >> 1;
            if (x >= this.xx[jm] == ascnd) {
                jl = jm;
            } else {
                ju = jm;
            }
        }
        this.cor = Math.abs(jl - this.jsav) > this.dj ? 0 : 1;
        this.jsav = jl;
        return Math.max(0, Math.min(this.n - this.mm, jl - ((this.mm - 2) >> 1)));
    }
}

//    public double rawInterpolate(int jlo, double x) {
//        return 0.0;
//    }
//
//    public double rawInterpolate(int jlo, double x, double[] input) {
//        return 0.0;
//    }
//
//    public void rawInterpolate(int jlo, double x, double[] input,
//        double[] result) {
//    }

//}


class DoubleBaseInterpolator extends BaseInterpolator {
    constructor(x, y, m) {
        super(x, m);
        this.yy = y;
    }
}

class LinearInterpolator extends DoubleBaseInterpolator {
    constructor(xValues, yValues) {
        super(xValues, yValues, 2)
    }

    rawInterpolate(j, x) {
    //    logit("j: " + j + " xx:" + this.xx.join(",") + " yy:" + this.yy.join(","));
        if (this.xx[j] == this.xx[j + 1]) {
            return this.yy[j];
        } else {
            return this.yy[j] + ((x - this.xx[j]) / (this.xx[j + 1] - this.xx[j]))
                * (this.yy[j + 1] - this.yy[j]);
        }
    }
}



