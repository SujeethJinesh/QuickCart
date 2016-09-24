package com.example.admin.quickcart;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.widget.TextView;

import java.util.ArrayList;

/**
 * Created by admin on 9/24/16.
 */
public class ItemScreen extends Activity {

    TextView descriptionView;
    TextView quantityView;
    TextView priceView;
    TextView nameView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.item_screen);

        Intent intent = getIntent();
        ArrayList<Item> items = (ArrayList<Item>) intent.getSerializableExtra("items");
        int position = (int) intent.getSerializableExtra("position");

        descriptionView = (TextView) findViewById(R.id.description);
        quantityView = (TextView) findViewById(R.id.quantity);
        priceView = (TextView) findViewById(R.id.price);
        nameView = (TextView) findViewById(R.id.name);

        descriptionView.setText(items.get(position).getDescription());
        quantityView.setText(items.get(position).getQuantity() + "");
        priceView.setText(Double.toString(items.get(position).getPrice()));
        nameView.setText(items.get(position).getName());
    }
}
