package com.example.admin.quickcart;

import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentActivity;
import android.support.v4.app.FragmentManager;
import android.support.v4.app.FragmentStatePagerAdapter;
import android.support.v4.view.ViewPager;

/**
 * Created by admin on 9/23/16.
 */
public class CarouselMaster extends FragmentActivity {

    ViewPager viewPager;
    CarouselAdapter carouselAdapter;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.carousel);

        viewPager = (ViewPager) findViewById(R.id.pager);
        FragmentManager fragmentManager = getSupportFragmentManager();
        carouselAdapter = new CarouselAdapter(fragmentManager);
        viewPager.setAdapter(carouselAdapter);
    }

    private class CarouselAdapter extends FragmentStatePagerAdapter {

        public CarouselAdapter(FragmentManager fm) {
            super(fm);
        }

        @Override
        public Fragment getItem(int position) {
            Fragment fragment = null;

            if (position == 0) {
                fragment = new CouponFeed(); //insert classes here
            }
            if (position == 1) {
                fragment = new ShoppingCartList();
            }
//            if (position == 2) {
//                fragment = new SomeRandomClass();
//            }
            return fragment;
        }

        @Override
        public int getCount() {
            return 2;
        }
    }
}
