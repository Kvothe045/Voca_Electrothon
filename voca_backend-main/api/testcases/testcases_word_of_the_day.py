from django.test import TestCase, Client
from django.urls import reverse
from unittest.mock import patch
import json

class WordOfTheDayTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse('wod')

    @patch('api.rsa.decrypt_message')
    @patch('api.rsa.load_private_key')
    @patch('api.Views.helper.check_user')
    @patch('api.dependencies.redis.Redis.mread')
    def test_valid_key_cached_word(self, mock_redis, mock_check_user, mock_load_key, mock_decrypt):
        mock_decrypt.return_value = 'valid_key'
        mock_check_user.return_value = True
        mock_redis.mread.return_value = ('2025-02-15', json.dumps({'word': 'hello'}))

        response = self.client.post(self.url, json.dumps({'api-key': 'encrypted'}), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('word_of_the_day', response.json())

    @patch('api.Views.helper.check_user')
    def test_invalid_key(self, mock_check_user):
        mock_check_user.return_value = False
        response = self.client.post(self.url, json.dumps({'api-key': 'invalid'}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())

    def test_missing_key(self):
        response = self.client.post(self.url, json.dumps({}), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('error', response.json())



