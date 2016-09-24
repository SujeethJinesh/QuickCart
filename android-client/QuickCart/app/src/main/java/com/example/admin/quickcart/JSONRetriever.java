package com.example.admin.quickcart;

import android.os.AsyncTask;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;

/**
 * Created by admin on 9/24/16.
 */
public class JSONRetriever extends AsyncTask<String, String, JSONObject> {

    private JSONObject jsonObject;
//    public AsyncResponse delegate = null;
    private OnTaskCompleted listener;

    public JSONRetriever(OnTaskCompleted listener) {
        this.listener = listener;
    }

    @Override
    protected JSONObject doInBackground(String... params) {
        //first need to set up an http url connection.
        HttpURLConnection connection = null;
        BufferedReader reader = null;

        try {
            URL url = new URL(params[0]);   //url we're trying to get data from
            connection = (HttpURLConnection) url.openConnection();  //opening initial connection
            connection.connect();   //attempting to connect

            InputStream stream = connection.getInputStream(); //this will return the stream of input we get
            //If you want to make it an well formatted JSON Json, do

//            JSONObject stream = new JSONObject(new JSONTokener(connection.getInputStream());

            //need a parser to read the InputStream, or use JSON methods if using that
            reader = new BufferedReader(new InputStreamReader(stream));

            //To keep run time short and reduce big O, use string buffer for parsing.
            StringBuffer buffer = new StringBuffer();

            String line = "";
            while ((line = reader.readLine()) != null) {
                buffer.append(line);
            }

            try {
                jsonObject = new JSONObject(buffer.toString());
            } catch (JSONException e) {
                e.printStackTrace();
            }

            return jsonObject;

        } catch (MalformedURLException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } finally { //need to close the connection and the reader
            if (connection != null) {
                connection.disconnect();
            }
            try {
                if (reader != null) {
                    reader.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return null;
    }

    @Override
    protected void onPostExecute(JSONObject jsonObject) {
        super.onPostExecute(jsonObject);
//        delegate.processFinish(jsonObject);
        Log.d("uygugug", "here yo");
        try {
            listener.onTaskCompleted(jsonObject);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }
}
